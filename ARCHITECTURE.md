# Job Getter Bot — Backend Architecture

## Overview

The Job Getter Bot is an autonomous job search engine with three layers:
1. **Hermes Agent (jobgetter profile)** — cron-driven scanner that discovers, evaluates, and alerts
2. **Flask Backend API** — serves the React dashboard and manages the SQLite database
3. **React Frontend** — warm editorial dashboard with pipeline tracking, job cards, and brief generation

## Database Schema (SQLite)

Location: `backend/jobs.db`

### Tables

**jobs** — Primary job listings
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| title | TEXT | Job title |
| company | TEXT | Company name |
| url | TEXT | Listing URL |
| match_score | INTEGER | 0-100 (5-scale × 20) |
| tier | INTEGER | 1 or 2 (priority) |
| salary_min | INTEGER | Lower bound |
| salary_max | INTEGER | Upper bound |
| salary_text | TEXT | Raw salary string |
| location | TEXT | Job location |
| posted_date | DATE | When posted |
| search_type | TEXT | 'corporate', 'nonprofit', 'pipeline_sync', 'cron_scan' |
| description | TEXT | Full JD text |
| requirements | TEXT | JSON array of requirements |
| benefits | TEXT | JSON array |
| red_flags | TEXT | Warning signs |
| company_overview | TEXT | Company intel |
| role_insights | TEXT | Role analysis |
| interview_prep | TEXT | JSON array of questions |
| talking_points | TEXT | JSON array |
| date_added | DATE | When added to DB |
| status | TEXT | New, Interested, Applied, Interview, Offer, Rejected |
| notes | TEXT | User notes |
| soul_score | INTEGER | 3D Soul dimension |
| pocket_score | INTEGER | 3D Pocket dimension |
| path_score | INTEGER | 3D Path dimension |
| score_breakdown | TEXT | JSON breakdown |

**applications** — Application tracking
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| job_id | INTEGER FK | References jobs.id |
| applied_date | DATE | When applied |
| status | TEXT | Current status |
| notes | TEXT | Application notes |

**interviews** — Interview tracking
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| job_id | INTEGER FK | References jobs.id |

**strategy_kits** — Interview prep packages
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| job_id | INTEGER FK | References jobs.id |
| data | JSON | Full strategy kit |
| created_at | DATETIME | When created |

**activity_log** — Audit trail of all actions
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| timestamp | DATETIME | When action occurred |
| actor | TEXT | 'bot', 'user', or 'system' |
| action | TEXT | Action type (scan_cycle, jd_extraction, status_change, etc.) |
| details | TEXT | Human-readable details |
| job_id | INTEGER | Related job ID (nullable) |
| job_title | TEXT | Related job title (nullable) |
| job_company | TEXT | Related company (nullable) |

**brief_history** — Generated brief tracking
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| generated_at | DATETIME | When brief was generated |
| actor | TEXT | Who triggered it |
| telegram_sent | INTEGER | 1 if pushed to Telegram |
| activities_count | INTEGER | Events included |
| summary | TEXT | Brief excerpt |

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/health | Health check |
| GET | /api/get_jobs | All jobs (sorted by score desc) |
| GET | /api/get_strategy/:id | Strategy kit for a job |
| GET | /api/interview-prep/:id | Interview prep questions + company intel |
| GET | /api/pipeline | Pipeline.md parsed entries |
| GET | /api/applications | Applications.md entries |
| GET | /api/followups | Follow-ups.md entries |
| GET | /api/stats | Dashboard stats (counts, funnel, scores) |
| GET | /api/activity | Activity log (filterable by actor) |
| GET | /api/last_brief | Last brief metadata |
| POST | /api/update_status | Update job status (DB + markdown sync) |
| POST | /api/update_notes | Update job notes |
| POST | /api/brief | Generate brief, send to Telegram, download |

## Data Flow

```
Cron (every 4h)
  │
  ├─ web_search → discovers job URLs
  ├─ web_extract → pulls JD text
  ├─ Score (Soul/Pocket/Path) → match_score
  ├─ INSERT into jobs.db → pipeline_sync
  ├─ Append to data/pipeline.md → markdown backup
  ├─ Append to data/scan-history.tsv → dedup
  └─ If score >= 4.0 → push to Telegram
  │
Dashboard (localhost:5000)
  │
  ├─ GET /api/get_jobs → renders job cards
  ├─ POST /api/update_status → status change + activity_log
  ├─ POST /api/brief → compile + Telegram + download
  └─ GET /api/stats → funnel chart
```

## Hermes Profile (bot-config branch)

The `jobgetter` Hermes profile lives at `~/AppData/Local/hermes/profiles/jobgetter/`.
Its config files are version-controlled on the `bot-config` branch:
- `profile-config/config.yaml` — model, telegram, toolsets
- `profile-config/cron/jobs.json` — cron job definition
- `profile-config/.env.template` — env vars (redacted)
- `profile-config/SOUL.md` — agent identity
