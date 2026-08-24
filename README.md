# Job Getter — Production Dashboard

Full-stack job acquisition dashboard for Blake E. Bridgers.
React 19 + Tailwind v4 + Three.js frontend · Flask API backend · SQLite + markdown data layer.

## Quick Start (Local)

```
1. Double-click start.bat
2. Open http://127.0.0.1:5000
```

The server auto-copies `jobs.db` from the legacy project on first run and mirrors
all UI writes back to the workspace markdown files (`data/applications.md`).

## Architecture

```
job-getter/
├── start.bat                  ← one-click launcher (Windows)
├── Procfile                   ← Render/Heroku deployment
├── backend/
│   ├── server.py              ← Flask API, 10 endpoints, SPA serving
│   ├── jobs.db                ← unified database (auto-created)
│   └── requirements.txt       ← Python deps
├── frontend/
│   ├── src/
│   │   ├── components/        ← JobCard, Pipeline, Modals, StatsBar...
│   │   │   └── StoneField.jsx ← Three.js 3D signature element
│   │   └── styles/globals.css ← Tailwind v4 theme (alabaster/sage/rust/mustard)
│   └── dist/                  ← production build (served by Flask)
├── data/
│   ├── pipeline.md            ← bot-written pipeline (bidirectional sync)
│   └── applications.md        ← application log (UI writes land here too)
└── references/                ← interview guide template, prompts
```

## Rebuild Frontend

```bash
cd frontend
npm install --legacy-peer-deps   # first time only
npm run build                    # output → dist/, Flask picks it up live
```

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/health | Health check |
| GET | /api/get_jobs | All jobs + status + strategy flags |
| GET | /api/get_strategy/:id | Full strategy kit JSON |
| GET | /api/interview-prep/:id | Predicted questions + company intel |
| POST | /api/update_status | Status change (SQLite + markdown sync) |
| POST | /api/update_notes | Save notes |
| GET | /api/pipeline | Workspace pipeline.md |
| GET | /api/applications | Applications log |
| GET | /api/followups | Follow-ups due |
| GET | /api/stats | Funnel + response metrics |

## Deploy to Render

1. Push this folder to a GitHub repo
2. Render → New Web Service → connect repo
3. Build command: `pip install -r backend/requirements.txt && cd frontend && npm install --legacy-peer-deps && npm run build`
4. Start command: `gunicorn -w 2 -b 0.0.0.0:$PORT backend.server:app`

## Design System

Warm editorial palette — alabaster canvas `#F3EFE7`, sage `#75836B`, rust `#B25B3F`,
antiqued blue `#57708A`, mustard `#C79A2E`, clay `#C07A50`, olive `#6B6B3A`.
Type: Fraunces (display serif) + Figtree (UI). Motion: expo-out curves throughout.
