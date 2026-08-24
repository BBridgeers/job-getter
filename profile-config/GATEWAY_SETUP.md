# Gateway Setup — jobgetter profile

## Telegram Bot Configuration

1. Create a bot via @BotFather in Telegram
2. Copy the bot token
3. Add to `~/AppData/Local/hermes/profiles/jobgetter/.env`:
   ```
   TELEGRAM_BOT_TOKEN=<token>
   TELEGRAM_ALLOWED_USERS=<your_user_id>
   TELEGRAM_HOME_CHANNEL=<your_chat_id>
   TELEGRAM_HOME_CHANNEL_NAME=Blake
   ```
4. Add telegram section to `config.yaml`:
   ```yaml
   telegram:
     require_mention: false
     allowed_chats:
       - <your_chat_id>
   ```
5. Install gateway: `HERMES_HOME=~/AppData/Local/hermes/profiles/jobgetter hermes gateway install`
6. Verify: `hermes gateway list` should show jobgetter as running

## Cron Job Setup

The cron job is defined in `cron/jobs.json` and managed by the Hermes scheduler.

- **ID**: 4c88ed452af3
- **Schedule**: every 240m (4 hours)
- **Model**: nvidia/nemotron-3-super-120b-a12b:free (OpenRouter free tier)
- **Provider**: openrouter
- **Delivery**: telegram (push to chat)
- **Continuity**: on (each run sees previous output for dedup)
- **Skills**: career-ops-shared, career-ops-scan, career-ops-evaluate, career-ops-pipeline, career-ops-followup, career-ops-tracker
- **Workdir**: ~/Documents/job-getter
- **Toolsets**: web, file, terminal

### To recreate the cron job:
```bash
HERMES_HOME=~/AppData/Local/hermes/profiles/jobgetter hermes cron create \
  --name "Job Getter Bot — Always-On Scanner" \
  --deliver telegram \
  --model "nvidia/nemotron-3-super-120b-a12b:free" \
  --provider openrouter \
  --workdir ~/Documents/job-getter \
  --continuity \
  --skill career-ops-shared \
  --skill career-ops-scan \
  --skill career-ops-evaluate \
  --skill career-ops-pipeline \
  --skill career-ops-followup \
  --skill career-ops-tracker \
  "every 240m" \
  "Run the job-getter bot scan cycle..."
```

## Gateway Auto-Start

On Windows, the gateway install creates a Startup folder shortcut:
`C:\Users\<user>\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\Hermes_Gateway_jobgetter.vbs`

This starts the gateway automatically on login.

## Log Locations

- Gateway log: `~/AppData/Local/hermes/profiles/jobgetter/logs/gateway.log`
- Cron output: `~/AppData/Local/hermes/profiles/jobgetter/cron/output/`
- Cron DB: `~/AppData/Local/hermes/profiles/jobgetter/cron/executions.db`
