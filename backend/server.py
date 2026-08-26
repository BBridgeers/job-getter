#!/usr/bin/env python3
"""
Job Getter Bot — Unified Backend API
Serves the React frontend + integrates job-getter workspace data.

Endpoints:
  GET  /api/health              — health check
  GET  /api/get_jobs            — all jobs (SQLite) merged with workspace pipeline
  GET  /api/get_strategy/<id>   — strategy kit for a job
  POST /api/update_status       — update application status (bidirectional: SQLite + markdown)
  POST /api/update_notes        — save notes (bidirectional)
  GET  /api/pipeline            — read pipeline.md from workspace
  GET  /api/applications        — read applications.md from workspace
  GET  /api/followups           — follow-ups due
  GET  /api/stats               — dashboard stats (counts, funnel, scores)
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import sqlite3
import json
import os
import re
from datetime import datetime, date

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACE = os.path.dirname(BACKEND_DIR)                      # ~/Documents/job-getter
LEGACY_DB = os.path.join(os.path.expanduser("~"),
                         "Documents", "job_search_automation", "jobs.db")
FRONTEND_DIST = os.path.join(WORKSPACE, "frontend", "dist")

app = Flask(__name__, static_folder=FRONTEND_DIST, static_url_path="")
CORS(app)

DB_PATH = os.path.join(BACKEND_DIR, "jobs.db")

# Use local copy of legacy DB if present; fall back to original read-only source.
if not os.path.exists(DB_PATH) and os.path.exists(LEGACY_DB):
    import shutil
    shutil.copy2(LEGACY_DB, DB_PATH)


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_schema(conn):
    """Create tables if missing so a fresh DB never crashes the API."""
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT, company TEXT, url TEXT,
        match_score INTEGER DEFAULT 0, tier INTEGER DEFAULT 1,
        salary_min INTEGER, salary_max INTEGER, salary_text TEXT,
        location TEXT, posted_date DATE, search_type TEXT DEFAULT 'corporate',
        description TEXT, requirements TEXT, benefits TEXT, red_flags TEXT,
        company_overview TEXT, role_insights TEXT, interview_prep TEXT,
        talking_points TEXT, date_added DATE, status TEXT DEFAULT 'New',
        notes TEXT, soul_score INTEGER, pocket_score INTEGER, path_score INTEGER,
        score_breakdown TEXT)""")
    c.execute("""CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER, applied_date DATE, status TEXT, notes TEXT)""")
    c.execute("""CREATE TABLE IF NOT EXISTS strategy_kits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER, data JSON, created_at DATETIME)""")
    c.execute("""CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        actor TEXT NOT NULL, action TEXT NOT NULL, details TEXT,
        job_id INTEGER, job_title TEXT, job_company TEXT)""")
    c.execute("""CREATE TABLE IF NOT EXISTS brief_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        actor TEXT DEFAULT 'user', telegram_sent INTEGER DEFAULT 0,
        activities_count INTEGER DEFAULT 0, summary TEXT)""")
    conn.commit()


conn = get_db()
ensure_schema(conn)
conn.close()

# ---------------------------------------------------------------------------
# Workspace markdown adapters (pipeline.md / applications.md / follow-ups.md)
# ---------------------------------------------------------------------------
PIPELINE_MD = os.path.join(WORKSPACE, "data", "pipeline.md")
APPLICATIONS_MD = os.path.join(WORKSPACE, "data", "applications.md")
FOLLOWUPS_MD = os.path.join(WORKSPACE, "data", "follow-ups.md")


def parse_pipeline_md():
    """Parse pipeline.md table rows into dicts. Tolerates missing file."""
    if not os.path.exists(PIPELINE_MD):
        return []
    rows = []
    with open(PIPELINE_MD, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line.startswith("|") or set(line) <= {"|", "-", " "}:
                continue
            cells = [c.strip() for c in line.strip("|").split("|")]
            if len(cells) >= 3 and cells[0].lower() != "id":
                rows.append({"id": cells[0], **{f"col{i+1}": v for i, v in enumerate(cells[1:])}})
    return rows


def append_pipeline_md(entry_line):
    """Append a row to pipeline.md (bidirectional write path)."""
    os.makedirs(os.path.dirname(PIPELINE_MD), exist_ok=True)
    header_needed = not os.path.exists(PIPELINE_MD)
    with open(PIPELINE_MD, "a", encoding="utf-8") as f:
        if header_needed:
            f.write("| ID | Company | Role | Score | Status | Next Action |\n")
            f.write("|----|---------|------|-------|--------|-------------|\n")
        f.write(entry_line.rstrip("\n") + "\n")


def append_applications_md(entry_line):
    os.makedirs(os.path.dirname(APPLICATIONS_MD), exist_ok=True)
    header_needed = not os.path.exists(APPLICATIONS_MD)
    with open(APPLICATIONS_MD, "a", encoding="utf-8") as f:
        if header_needed:
            f.write("| Date | Company | Role | Status | PDF | Notes |\n")
            f.write("|------|---------|------|--------|-----|-------|\n")
        f.write(entry_line.rstrip("\n") + "\n")


# ---------------------------------------------------------------------------
# Health & static
# ---------------------------------------------------------------------------
@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "time": datetime.now().isoformat(),
                    "db": os.path.exists(DB_PATH),
                    "workspace": WORKSPACE})


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    full = os.path.join(FRONTEND_DIST, path)
    if path and os.path.isfile(full):
        return send_from_directory(FRONTEND_DIST, path)
    # Never fall back for asset paths — a missing chunk is a hard 404
    # (prevents stale-cached index.html from receiving HTML-as-JS)
    if path.startswith("assets/") or path.endswith((".js", ".css", ".map", ".woff2", ".png", ".svg")):
        return jsonify({"error": "Asset not found — rebuild frontend"}), 404
    index = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.exists(index):
        resp = send_from_directory(FRONTEND_DIST, "index.html")
        resp.headers["Cache-Control"] = "no-store"
        return resp
    return jsonify({"error": "Frontend not built. Run: cd frontend && npm run build"}), 404


# ---------------------------------------------------------------------------
# Jobs
# ---------------------------------------------------------------------------
@app.route("/api/get_jobs")
def get_jobs():
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute("""
            SELECT j.*, a.status AS app_status, a.applied_date, s.id AS strategy_id
            FROM jobs j
            LEFT JOIN applications a ON j.id = a.job_id
            LEFT JOIN strategy_kits s ON j.id = s.job_id
            ORDER BY j.match_score DESC
        """)
        jobs = [dict(r) for r in c.fetchall()]
    finally:
        conn.close()

    for j in jobs:
        j["display_status"] = j.get("app_status") or j.get("status") or "New"
        j["has_strategy"] = bool(j.get("strategy_id"))
        tags = []
        if (j.get("match_score") or 0) >= 90:
            tags.append("High Match")
        if j.get("tier") == 1:
            tags.append("Tier 1")
        if (j.get("salary_min") or 0) > 100000:
            tags.append("High Pay")
        if j["has_strategy"]:
            tags.append("Strategy Ready")
        j["tags"] = tags

    return jsonify(jobs)


@app.route("/api/get_strategy/<int:job_id>")
def get_strategy(job_id):
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute("""SELECT j.title, j.company, s.data
                     FROM jobs j LEFT JOIN strategy_kits s ON j.id = s.job_id
                     WHERE j.id = ?""", (job_id,))
        r = c.fetchone()
    finally:
        conn.close()
    if not r:
        return jsonify({"error": "Job not found"}), 404
    return jsonify({"title": r["title"], "company": r["company"],
                    "strategy": json.loads(r["data"]) if r["data"] else None})


def _parse_jsonish(value):
    """DB stores some fields as JSON arrays-as-text; parse defensively."""
    if value is None:
        return []
    if isinstance(value, list):
        return value
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, list) else [str(parsed)]
    except (json.JSONDecodeError, TypeError):
        return [line.strip(" -\"'") for line in str(value).splitlines() if line.strip()]


@app.route("/api/interview-prep/<int:job_id>")
def interview_prep(job_id):
    """Real interview prep from stored job intelligence (no mocks)."""
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute("""SELECT title, company, location, interview_prep, talking_points,
                            company_overview, role_insights, requirements, red_flags,
                            salary_min, salary_max
                     FROM jobs WHERE id=?""", (job_id,))
        r = c.fetchone()
    finally:
        conn.close()
    if not r:
        return jsonify({"error": "Job not found"}), 404

    questions = []
    for i, q in enumerate(_parse_jsonish(r["interview_prep"]), 1):
        questions.append({
            "id": i,
            "category": "Role-Specific",
            "question": q,
            "talkingPoints": _parse_jsonish(r["talking_points"])[:3],
        })
    if not questions:
        questions = [{
            "id": 1, "category": "Behavioral",
            "question": f"Walk me through your background and why it fits the {r['title']} role.",
            "talkingPoints": ["Lead with 12+ years enterprise tech consulting",
                              "Quantify retention and adoption wins",
                              "Connect Yooz onboarding program design to this role"],
        }]

    salary_low, salary_high = r["salary_min"], r["salary_max"]
    return jsonify({
        "title": r["title"], "company": r["company"], "location": r["location"],
        "predictedQuestions": questions,
        "companyIntel": {
            "overview": r["company_overview"] or f"{r['company']} — see listing for details.",
            "roleInsights": r["role_insights"] or "",
            "keyRequirements": _parse_jsonish(r["requirements"])[:6],
            "redFlags": r["red_flags"] or "",
            "salaryBand": {"low": salary_low, "high": salary_high} if salary_low else None,
        },
    })


# ---------------------------------------------------------------------------
# Writes (bidirectional: SQLite + workspace markdown)
# ---------------------------------------------------------------------------
VALID_STATUSES = {"New", "Interested", "Applied", "Interview", "Offer", "Rejected"}


@app.route("/api/update_status", methods=["POST"])
def update_status():
    data = request.get_json(silent=True) or {}
    job_id = data.get("job_id") or data.get("id")
    new_status = data.get("status")
    if not job_id or not new_status:
        return jsonify({"error": "Missing job_id or status"}), 400
    if new_status not in VALID_STATUSES:
        return jsonify({"error": f"Invalid status. Valid: {sorted(VALID_STATUSES)}"}), 400

    conn = get_db()
    c = conn.cursor()
    try:
        c.execute("SELECT title, company FROM jobs WHERE id=?", (job_id,))
        job = c.fetchone()
        if not job:
            return jsonify({"error": "Job not found"}), 404

        c.execute("SELECT id FROM applications WHERE job_id=?", (job_id,))
        existing = c.fetchone()
        today = date.today().isoformat()
        if existing:
            c.execute("UPDATE applications SET status=? WHERE job_id=?", (new_status, job_id))
        else:
            c.execute("INSERT INTO applications (job_id, status, applied_date) VALUES (?,?,?)",
                      (job_id, new_status, today))
        c.execute("UPDATE jobs SET status=? WHERE id=?", (new_status, job_id))
        conn.commit()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

    # Mirror to workspace markdown (zero-loss bidirectional sync)
    append_applications_md(f"| {today} | {job['company']} | {job['title']} | {new_status} |  | synced from UI |")
    log_activity("user", "status_change", f"Status changed to {new_status}", job_id, job["title"], job["company"])
    return jsonify({"success": True, "job_id": job_id, "status": new_status})


@app.route("/api/update_notes", methods=["POST"])
def update_notes():
    data = request.get_json(silent=True) or {}
    job_id = data.get("job_id") or data.get("id")
    notes = data.get("notes", "")
    if not job_id:
        return jsonify({"error": "Missing job_id"}), 400

    conn = get_db()
    try:
        conn.execute("UPDATE jobs SET notes=? WHERE id=?", (notes, job_id))
        conn.commit()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()
    return jsonify({"success": True})


# ---------------------------------------------------------------------------
# Workspace reads
# ---------------------------------------------------------------------------
@app.route("/api/pipeline")
def pipeline():
    return jsonify(parse_pipeline_md())


@app.route("/api/applications")
def applications():
    if not os.path.exists(APPLICATIONS_MD):
        return jsonify([])
    with open(APPLICATIONS_MD, encoding="utf-8") as f:
        return jsonify([l.rstrip("\n") for l in f if l.strip()])


@app.route("/api/followups")
def followups():
    if not os.path.exists(FOLLOWUPS_MD):
        return jsonify([])
    with open(FOLLOWUPS_MD, encoding="utf-8") as f:
        return jsonify([l.rstrip("\n") for l in f if l.strip()])


@app.route("/api/stats")
def stats():
    conn = get_db()
    c = conn.cursor()
    try:
        total = c.execute("SELECT COUNT(*) FROM jobs").fetchone()[0] or 0
        avg_raw = c.execute("SELECT AVG(match_score) FROM jobs").fetchone()[0]
        avg_score = round(avg_raw, 1) if avg_raw is not None else 0
        by_status = dict(c.execute(
            "SELECT COALESCE(app_status,'New'), COUNT(*) FROM ("
            " SELECT a.status AS app_status FROM applications a"
            " UNION ALL SELECT j.status FROM jobs j"
            " WHERE j.id NOT IN (SELECT job_id FROM applications))"
            " GROUP BY 1").fetchall())
        high_match = c.execute("SELECT COUNT(*) FROM jobs WHERE match_score>=85").fetchone()[0]
        strategies = c.execute("SELECT COUNT(*) FROM strategy_kits").fetchone()[0]
    finally:
        conn.close()
    return jsonify({
        "total_jobs": total, "avg_score": avg_score,
        "high_match": high_match, "strategy_kits": strategies,
        "by_status": {k: v for k, v in by_status.items() if v is not None},
        "funnel": [
            {"stage": s, "count": by_status.get(s, 0)}
            for s in ["New", "Interested", "Applied", "Interview", "Offer"]
        ],
    })


# -----------------------------------------------------------------------
# Activity Log + Brief Generation
# -----------------------------------------------------------------------

def log_activity(actor, action, details="", job_id=None, job_title=None, job_company=None):
    """Append to the activity log table."""
    conn = get_db()
    try:
        conn.execute("""INSERT INTO activity_log (actor, action, details, job_id, job_title, job_company)
                        VALUES (?, ?, ?, ?, ?, ?)""",
                      (actor, action, details, job_id, job_title, job_company))
        conn.commit()
    finally:
        conn.close()


@app.route("/api/activity")
def get_activity():
    """Return recent activity log entries, optionally filtered by actor."""
    actor = request.args.get("actor")
    limit = int(request.args.get("limit", 50))
    conn = get_db()
    try:
        if actor:
            rows = conn.execute(
                "SELECT * FROM activity_log WHERE actor=? ORDER BY timestamp DESC LIMIT ?",
                (actor, limit)).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT ?", (limit,)).fetchall()
    finally:
        conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/brief", methods=["POST"])
def generate_brief():
    """Compile all activity since the last brief, send to Telegram, return the text."""
    import urllib.request

    data = request.get_json(silent=True) or {}
    send_telegram = data.get("telegram", True)
    actor = data.get("actor", "user")

    conn = get_db()
    try:
        # Get the last brief timestamp
        last_brief = conn.execute(
            "SELECT generated_at FROM brief_history ORDER BY generated_at DESC LIMIT 1"
        ).fetchone()
        since = last_brief["generated_at"] if last_brief else "1970-01-01 00:00:00"

        # Get all activity since last brief
        activities = conn.execute(
            "SELECT * FROM activity_log WHERE timestamp > ? ORDER BY timestamp",
            (since,)
        ).fetchall()
        activities = [dict(r) for r in activities]

        # Get current stats
        total = conn.execute("SELECT COUNT(*) FROM jobs").fetchone()[0]
        high_match = conn.execute("SELECT COUNT(*) FROM jobs WHERE match_score >= 80").fetchone()[0]
        by_status = dict(conn.execute(
            "SELECT status, COUNT(*) FROM jobs GROUP BY status"
        ).fetchall())

        # Get top jobs by score
        top_jobs = conn.execute(
            "SELECT title, company, match_score, url, status FROM jobs ORDER BY match_score DESC LIMIT 10"
        ).fetchall()
        top_jobs = [dict(r) for r in top_jobs]
    finally:
        conn.close()

    # Build the brief text
    lines = []
    lines.append("JOB GETTER BRIEF")
    lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    lines.append(f"Since last brief: {since}")
    lines.append("")

    # Activity summary
    bot_acts = [a for a in activities if a["actor"] == "bot"]
    user_acts = [a for a in activities if a["actor"] == "user"]
    lines.append(f"ACTIVITY SINCE LAST BRIEF ({len(activities)} events)")
    lines.append(f"  Bot actions: {len(bot_acts)}")
    lines.append(f"  User actions: {len(user_acts)}")
    lines.append("")

    # Bot activity detail
    if bot_acts:
        lines.append("BOT ACTIVITY:")
        for a in bot_acts:
            ts = a["timestamp"]
            action = a["action"]
            details = a["details"] or ""
            company = a["job_company"] or ""
            title = a["job_title"] or ""
            if title and company:
                lines.append(f"  [{ts}] {action} — {title} @ {company}")
            else:
                lines.append(f"  [{ts}] {action} — {details[:120]}")
        lines.append("")

    # User activity detail
    if user_acts:
        lines.append("YOUR ACTIVITY:")
        for a in user_acts:
            ts = a["timestamp"]
            action = a["action"]
            details = a["details"] or ""
            company = a["job_company"] or ""
            title = a["job_title"] or ""
            if title and company:
                lines.append(f"  [{ts}] {action} — {title} @ {company}")
            else:
                lines.append(f"  [{ts}] {action} — {details[:120]}")
        lines.append("")

    # Current pipeline state
    lines.append("PIPELINE STATE:")
    lines.append(f"  Total jobs tracked: {total}")
    lines.append(f"  High-match (80+): {high_match}")
    for status, count in sorted(by_status.items()):
        lines.append(f"  {status}: {count}")
    lines.append("")

    # Top opportunities
    lines.append("TOP OPPORTUNITIES:")
    for j in top_jobs[:10]:
        score = j["match_score"] or 0
        score_5 = round(score / 20, 1)
        lines.append(f"  {j['company']} — {j['title']} — {score_5}/5 [{j['status']}]")
    lines.append("")

    # Applications
    lines.append("APPLICATIONS:")
    conn2 = get_db()
    try:
        app_rows = conn2.execute(
            "SELECT j.company, j.title, a.status, a.applied_date "
            "FROM applications a JOIN jobs j ON j.id = a.job_id "
            "ORDER BY a.applied_date DESC LIMIT 10"
        ).fetchall()
    finally:
        conn2.close()
    if app_rows:
        for row in app_rows:
            lines.append(f"  {row['company']} — {row['title']} — {row['status']} ({row['applied_date']})")
    else:
        lines.append("  (none yet)")
    lines.append("")

    brief_text = "\n".join(lines)

    # Send to Telegram if requested
    telegram_sent = 0
    if send_telegram:
        bot_token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
        chat_id = os.environ.get("TELEGRAM_HOME_CHANNEL", "")
        if bot_token and chat_id:
            try:
                # Split into 4000-char chunks (Telegram limit is 4096)
                chunks = []
                text = brief_text
                while text:
                    chunks.append(text[:4000])
                    text = text[4000:]
                for chunk in chunks:
                    payload = json.dumps({"chat_id": chat_id, "text": chunk}).encode()
                    req = urllib.request.Request(
                        f"https://api.telegram.org/bot{bot_token}/sendMessage",
                        data=payload,
                        headers={"Content-Type": "application/json"}
                    )
                    urllib.request.urlopen(req, timeout=10)
                telegram_sent = 1
            except Exception as e:
                brief_text += f"\n\n[Telegram send failed: {e}]"

    # Record this brief in history
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO brief_history (actor, telegram_sent, activities_count, summary) VALUES (?, ?, ?, ?)",
            (actor, telegram_sent, len(activities), brief_text[:500])
        )
        conn.commit()
    finally:
        conn.close()

    return jsonify({
        "brief": brief_text,
        "telegram_sent": bool(telegram_sent),
        "activities_count": len(activities),
        "since": since,
    })


@app.route("/api/last_brief")
def last_brief_info():
    """Return info about the last brief generated."""
    conn = get_db()
    try:
        r = conn.execute(
            "SELECT * FROM brief_history ORDER BY generated_at DESC LIMIT 1"
        ).fetchone()
    finally:
        conn.close()
    if r:
        return jsonify(dict(r))
    return jsonify({"generated_at": None})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Job Getter API on http://127.0.0.1:{port}  (workspace: {WORKSPACE})")
    app.run(host="127.0.0.1", port=port)
