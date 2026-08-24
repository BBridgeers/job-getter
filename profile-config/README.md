# Job Getter Profile Configuration

This directory contains the Hermes Agent profile configuration for the
job-getter bot. It is kept on a separate git branch (`bot-config`) to
separate infrastructure config from the main application code.

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Hermes Agent — jobgetter profile               │
│  ~/AppData/Local/hermes/profiles/jobgetter/      │
│                                                  │
│  ┌──────────────┐    ┌──────────────────────┐    │
│  │  Gateway      │    │  Cron Scheduler       │    │
│  │  (Telegram    │    │  (every 4h)           │    │
│  │   polling)    │    │                       │    │
│  └──────┬───────┘    └──────────┬───────────┘    │
│         │                        │                │
│         │  push notifications    │  scans jobs     │
│         ▼                        ▼                │
│  ┌──────────────────────────────────────────┐     │
│  │  ~/Documents/job-getter/                 │     │
│  │  ├── backend/ (Flask API + SQLite)       │     │
│  │  ├── frontend/ (React dashboard)         │     │
│  │  ├── data/ (pipeline, scan-history, etc) │     │
│  │  └── portals.yml (search config)         │     │
│  └──────────────────────────────────────────┘     │
└─────────────────────────────────────────────────┘
```

## Files

| File | Purpose |
|------|---------|
| `config.yaml` | Hermes config — model, telegram, toolsets, display |
| `profile.yaml` | Profile metadata |
| `SOUL.md` | Agent personality and identity |
| `cron/jobs.json` | Cron job definition (scan every 4h) |
| `.env.template` | Environment variables template (redacted) |

## Setup

1. Create a Telegram bot via @BotFather
2. Create a Hermes profile: `hermes profile create jobgetter --clone`
3. Copy `.env.template` to `.env` and fill in tokens
4. Start the gateway: `hermes gateway start`
5. The cron job fires every 4 hours and pushes to Telegram
