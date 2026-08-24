-- Job Getter Bot — Database Schema
-- SQLite3 schema for backend/jobs.db
-- Generated: 2026-08-24

CREATE TABLE activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    job_id INTEGER,
    job_title TEXT,
    job_company TEXT
)



CREATE TABLE applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL,
        applied_date DATE DEFAULT CURRENT_DATE,
        status TEXT DEFAULT 'Applied',
        notes TEXT,
        FOREIGN KEY (job_id) REFERENCES jobs (id)
    )



CREATE TABLE brief_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    actor TEXT DEFAULT 'user',
    telegram_sent INTEGER DEFAULT 0,
    activities_count INTEGER DEFAULT 0,
    summary TEXT
)



CREATE TABLE interviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        application_id INTEGER NOT NULL,
        interview_date DATETIME,
        type TEXT,
        notes TEXT,
        FOREIGN KEY (application_id) REFERENCES applications (id)
    )



CREATE TABLE jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        url TEXT UNIQUE,
        match_score INTEGER,
        tier INTEGER DEFAULT 3,
        salary_min INTEGER,
        salary_max INTEGER,
        salary_text TEXT,
        location TEXT,
        posted_date DATE,
        search_type TEXT,
        description TEXT,
        requirements TEXT,
        benefits TEXT,
        red_flags TEXT,
        company_overview TEXT,
        role_insights TEXT,
        interview_prep TEXT,
        talking_points TEXT,
        date_added DATE DEFAULT CURRENT_DATE,
        status TEXT DEFAULT 'New',
        notes TEXT
    , soul_score INTEGER DEFAULT 0, pocket_score INTEGER DEFAULT 0, path_score INTEGER DEFAULT 0, score_breakdown TEXT)



CREATE TABLE sqlite_sequence(name,seq)



CREATE TABLE strategy_kits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL,
        data JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES jobs (id)
    )


