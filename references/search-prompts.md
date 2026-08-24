# Search & Extraction Architecture — Ollama Cloud Powered

## Architecture (Replaces Perplexity)

The old system sent a single prompt to Perplexity API which combined web search + extraction + scoring in one call. The new architecture separates concerns:

1. **Discovery** — Hermes native `web_search` tool finds job postings (site: filters, ATS APIs)
2. **Extraction** — `web_extract` pulls JD content from posting URLs
3. **Intelligence** — Ollama Cloud model (deepseek-v4-pro) processes the JD + Blake's profile → 30-field structured JSON + strategy kit
4. **Scoring** — 3D scoring engine (Soul/Pocket/Path) calculates match score
5. **Storage** — Results saved to job-getter workspace

## Model Assignment (verified Aug 21 2026 — two providers)

ox-alpha-free is free unlimited via OpenCode Go until ~Aug 27. Stealth model (~90% confirmed Zhipu GLM-5.5 multimodal variant) beating deepseek-v4-pro on reasoning/coding benchmarks. Hammer it for all heavy tasks while it lasts. deepseek-v4-pro and glm-5.2 on both providers for fallback when Ox Alpha expires.

| Task | Model | Primary Provider | Fallback (when Ox Alpha expires) |
|------|-------|------------------|-----------------------------------|
| Job extraction + 30-field JSON | ox-alpha-free | opencode-go | deepseek-v4-pro (either) |
| Strategy kit generation (50-section) | ox-alpha-free | opencode-go | kimi-k3 (opencode-go) then deepseek-v4-pro |
| Cover letter / resume tailoring | ox-alpha-free | opencode-go | deepseek-v4-pro (either) |
| Quick batch scoring | ox-alpha-free | opencode-go | glm-5.2 (either) |
| Fallback cascade | deepseek-v4-pro then glm-5.3 then kimi-k3 then deepseek-v4-flash then minimax-m3 then qwen3.8-max | either | either |

Ox Alpha: free until ~Aug 27. 1M context, multimodal, zero data retention. Model ID: opencode-go/ox-alpha-free

Ollama Cloud: deepseek-v4-pro, deepseek-v4-flash, kimi-k2.7-code, kimi-k2.6, glm-5.2, glm-5.1, minimax-m2.7, minimax-m3, nemotron-3-ultra, nemotron-3-super, nemotron-3-nano, qwen3.5, gemma4, mistral-large-3, gpt-oss

OpenCode Go (current): grok-4.5, glm-5.3, glm-5.2, glm-5.1, gpt-5.6-luna, kimi-k3, kimi-k2.7-code, kimi-k2.6, mimo-v2.5, mimo-v2.5-pro, minimax-m3, minimax-m2.7, qwen3.8-max, qwen3.7-max, qwen3.7-plus, qwen3.6-plus, deepseek-v4-pro, deepseek-v4-flash, deepseek-v4-flash-vision-exp, hy3, muse-spark-1.2 (limited regions), ox-alpha-free (free until ~Aug 27)

## Extraction Prompt (for deepseek-v4-pro)

### System Prompt
```
You are a high-level Executive Recruiter Agent for Blake E. Bridgers.
Your goal is to analyze a job posting and extract structured, actionable data.
You must output your answer STRICTLY as a JSON object. No markdown, no conversational text.

CANDIDATE PROFILE:
- Blake E. Bridgers, Southlake TX (DFW), BBA Finance Baylor 2012
- 12+ years B2B SaaS customer success, account management, enterprise technology consulting
- Expert: Salesforce (10+ yrs), Gainsight, Salesloft, MEDDIC, Challenger
- Target roles: Customer Success Executive, Account Manager, Implementation Consultant, Client Partner, Strategic Account Executive
- Geography: DFW + Remote (US)
- Key wins: 112% quota at Yooz, $3.75M revenue at Clear Tech, $7.2M closed at VCE/DELL EMC, 131-135% at HPE
- Career gap: strategic pivot from sales to Customer Success (70%) + burnout recovery (30%)

SCORING RUBRIC (0-100):
1. Responsibilities Alignment (40pts): Does the day-to-day work match Blake's expertise in driving retention, expansion, and strategic relationships?
2. Experience/Role Title Match (30pts): Target roles: Customer Success Executive, CSM, Account Manager, Implementation Consultant, Client Partner, Strategic Account Executive, Client Success Manager, Customer Experience Manager, Enterprise Account Manager, Strategic Relationship Manager, Onboarding Manager, Engagement Manager, Solutions Consultant, Enablement Manager, Renewal Manager, Expansion Manager, Adoption Manager, Customer Education Specialist, etc.
3. Skills/Tools (15pts): Salesforce, Gainsight, MEDDIC, Challenger, QBR/SBR, health scoring, churn prevention.
4. Culture/Location (10pts): Remote or Dallas-Fort Worth. High-growth/innovation culture.
5. Salary Range (5pts): Flexible — optimize for right role, money follows.

AUTO-REJECT (Score = 0): SDR, BDR, Sales Development Representative, Business Development Representative, cold outbound, hunter-only roles, entry-level, intern, part-time, contract-only.
```

### User Query Template
```
Analyze this job posting and extract all 30 fields. The job data will be provided below.

JOB TITLE: {title}
COMPANY: {company}
LOCATION: {location}
URL: {url}

JOB DESCRIPTION:
{jd_content}

Extract these 30 fields as a JSON object:
1. title — Job Title
2. company — Company Name
3. location — City/State or Remote
4. match_score — 0-100 based on rubric above
5. listing_url — Direct link to the job post
6. application_url — Direct link to apply (if different from listing)
7. summary_bullets — 3 key highlights of the role (array of strings)
8. company_overview — Brief 2-sentence company description
9. role_insights — What success looks like in this role
10. key_requirements — Top 3 hard skills needed (array)
11. salary_intel — Estimated range or mentioned comp
12. application_strategy — One specific tip to stand out
13. red_flags — Any potential downsides or risks
14. cultural_fit — Describe the vibe
15. competitive_landscape — Who are their main rivals?
16. skills_gap — One skill Blake might need to brush up on
17. network_leverage — Who to reach out to at this company
18. decision_timeline — Urgent? Rolling? Estimated timeline
19. career_trajectory — Where does this role lead?
20. resume_keywords — 5 ATS keywords to include (array)
21. resume_summary — A tailored 2-sentence summary for Blake's CV
22. cover_letter — A draft opening paragraph in Blake's voice (thesis-statement opening, confident, no corporate-speak)
23. why_me_bullets — 3 arguments for why Blake is the perfect fit (array)
24. why_them_bullets — 3 reasons why Blake wants to join THEM (array)
25. interview_prep — 3 likely interview questions (array)
26. star_hooks — A STAR story suggestion from Blake's background
27. talking_points — 2 strategic topics to discuss with leadership (array)
28. questions_to_ask — 2 smart questions to ask the hiring manager (array)
29. recruiter_email — Guess the format: firstname.lastname@company.com
30. plan_30_60_90 — A rough 30-60-90 day plan outline

3D SCORE BREAKDOWN:
- soul_score (0-100): Strategic fit — mission alignment, location, red flags
- pocket_score (0-100): Technical match — comp, role title, seniority
- path_score (0-100): Logistical — application ease, network leverage, freshness
```

## Hermes Workflow (How the bot actually executes)

### Phase 1: Discovery (Hermes native tools — no LLM needed)
```
web_search("site:boards.greenhouse.io Customer Success Dallas OR Remote")
web_search("site:jobs.ashbyhq.com Account Manager Dallas OR Remote")
web_search("site:jobs.lever.co Implementation Consultant Remote")
web_search("site:linkedin.com/jobs Customer Success Executive Dallas-Fort Worth")
→ Returns URLs + titles + descriptions
```

### Phase 2: JD Extraction (Hermes native tools)
```
web_extract([url1, url2, url3, url4, url5])
→ Returns full JD text for each URL
```

### Phase 3: Intelligence (ox-alpha-free via OpenCode Go — free until ~Aug 27)
```
For each extracted JD:
  hermes chat --provider opencode-go --model ox-alpha-free \
    -q "Analyze this job posting..." -Q --max-turns 1
→ Returns 30-field JSON + 3D scores
Fallback: hermes chat --provider ollama-cloud --model deepseek-v4-pro
```

### Phase 4: Scoring (Python scoring_engine.py)
```
python scripts/scoring_engine.py
→ Calculates Soul/Pocket/Path from extracted fields
→ Updates match_score in database
```

### Phase 5: Strategy Kit Generation (ox-alpha-free via OpenCode Go — free until ~Aug 27)
```
For Tier 1 jobs (score >= 85):
  Load references/interview-guide-template.md
  Load references/generation-instructions.md
  Inject job data + Blake's profile
  hermes chat --provider opencode-go --model ox-alpha-free \
    -q "Generate complete 50-section acquisition guide..." -Q --max-turns 1
  → Generates complete 50-section acquisition guide
  Fallback: kimi-k3 (opencode-go) → deepseek-v4-pro (either provider)
```

## 3D Scoring Engine (Soul/Pocket/Path)

### Soul Score (0-100) — Strategic Fit
- Mission/Keywords Alignment: 50 pts (10 pts per keyword match, cap at 5 matches)
- Lifestyle/Location: 30 pts (remote=30, DFW/TX=30, unknown=10, other=0)
- Red Flags: 20 pts (none=20, list deducts 10 per flag)

### Pocket Score (0-100) — Technical Match
- Compensation: 40 pts (flexible — if comp not listed, default 20)
- Role Title Match: 30 pts (target role=30, manager/lead/director=20, other=10)
- Seniority: 30 pts (senior/principal/head/strategic/director=30, mid-level=15)

### Path Score (0-100) — Logistical Feasibility
- Application Ease: 40 pts (LinkedIn Easy Apply=40, Greenhouse/Lever/Ashby=35, Workday/Taleo=10, standard=25)
- Network Leverage: 40 pts (recruiter email=40, none=10)
- Freshness: 20 pts (hours/today=20, ≤3 days=20, ≤7 days=10, else=5)

### Final Score
Weighted: Soul × 0.35 + Pocket × 0.40 + Path × 0.25

## Data Tier Guidelines

### Tier 1 (Top 5 matches per scan) — Full Applied Research + Application Pack
- 15 strategic analysis fields + full application pack (resume keywords, tailored summary, cover letter draft, why_me/why_them bullets, interview prep, STAR hooks, talking points, questions, recruiter email, 30-60-90 plan)
- Model: deepseek-v4-pro

### Tier 2 (Positions 6-10) — Applied Research only
- 15 strategic analysis fields, no application pack
- Model: glm-5.2

### Tier 3 (Positions 11+) — Basic data only
- Title, company, match score only
- No LLM call needed — scored by Python engine from web_search metadata

### Daily Maximums
- Tier 1: 5 jobs get full deepseek-v4-pro analysis
- Tier 2: 5 jobs get glm-5.2 analysis
- Tier 3: Unlimited — Python-scored from search metadata