# Saree Studio WhatsApp Bot — Vercel + Supabase Edition

## Folder structure
```
api/
  webhook.js         <- Meta hits this URL (GET verify + POST messages)
  customers.js        <- GET list of customers (for dashboard later)
  orders.js            <- GET list of orders
  messages/[waId].js   <- GET chat history for one customer
  broadcast.js         <- POST to trigger a broadcast (small lists)
lib/
  db.js                <- Postgres pool (Supabase)
  whatsapp.js          <- Cloud API senders
  webhook-logic.js      <- all chatbot conversation logic
scripts/
  broadcast.js          <- run locally for large broadcast lists
schema.sql              <- run once in Supabase to create tables
```

## Step 1 — Create your Supabase project
1. supabase.com → New Project → pick a region close to your customers (e.g. Mumbai/Singapore for India)
2. Once created: SQL Editor → New Query → paste the contents of `schema.sql` → Run
3. Project Settings → Database → Connection string → click the **"Transaction"** tab (pooled, port 6543) → copy it → this is your `DATABASE_URL`
   - Use the **pooler** string, not the direct 5432 one — direct connections don't handle serverless cold starts well and you'll hit "too many connections" errors under real traffic.

## Step 2 — Push to GitHub
```bash
git init
git add .
git commit -m "saree bot - vercel + supabase"
git remote add origin https://github.com/yourname/saree-bot.git
git push -u origin main
```

## Step 3 — Deploy to Vercel
1. vercel.com → Add New Project → Import your GitHub repo
2. Before first deploy, add all env vars from `.env.example` under Project Settings → Environment Variables (paste real values)
3. Deploy. Vercel gives you a URL like `https://saree-bot.vercel.app`
4. Your webhook URL is: `https://saree-bot.vercel.app/api/webhook`

## Step 4 — Connect the webhook in Meta
Same as before: Meta App → WhatsApp → Configuration →
- Callback URL: `https://saree-bot.vercel.app/api/webhook`
- Verify token: same value as `VERIFY_TOKEN`
- Subscribe to `messages` field
- Then run the one-time subscribe call (from your terminal, using your permanent token):
```bash
curl -X POST "https://graph.facebook.com/v20.0/{WABA_ID}/subscribed_apps" \
  -H "Authorization: Bearer {YOUR_PERMANENT_TOKEN}"
```

## Testing locally before deploying (optional, using Cloudflare Tunnel)
If you want to test on your laptop first instead of redeploying to Vercel every time:
```bash
npm i -g vercel        # Vercel's local dev server mimics the real /api routing
vercel dev              # starts on localhost:3000
```
In a second terminal:
```bash
cloudflared tunnel --url http://localhost:3000
```
This prints a temporary public HTTPS URL (e.g. `https://random-name.trycloudflare.com`).
Use `https://random-name.trycloudflare.com/api/webhook` as your Meta callback
URL *while testing only*. It resets every time you restart the tunnel, so
switch back to your real Vercel URL once you're happy.

## Broadcasts
- Small list (a few hundred): call `POST /api/broadcast` with header
  `Authorization: Bearer YOUR_ADMIN_PASSWORD` and body `{ "templateName": "your_template" }`
- Large list: run `node scripts/broadcast.js your_template_name` from your own machine (not on Vercel — avoids the function timeout)

## Known limitation carried over from Phase 1
`SAMPLE_PRODUCTS` in `lib/webhook-logic.js` is still a hardcoded list. Once
your real Meta Catalog is live, tell me and I'll wire this to fetch live
products via the Graph API instead.
<!-- Trigger Vercel Build -->