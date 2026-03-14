# Basic Frontend Webapp

A minimal static frontend app ready for Vercel deployment and LLM-assisted iteration.

## Repo

- GitHub: `https://github.com/apm106/job-apply`

## Run locally

Open `index.html` directly in your browser, or serve with any static server.

Example:

```bash
npx serve .
```

For full-stack local testing (frontend + `/api/waitlist`):

```bash
npm install
cp .env.example .env
npm run dev
```

## Deploy to Vercel

1. Install the Vercel CLI:
   ```bash
   npm i -g vercel
   ```
2. Login and deploy from this directory:
   ```bash
   vercel
   ```
3. For production deployment:
   ```bash
   vercel --prod
   ```

Vercel will automatically serve `index.html` as the app entrypoint.

Deployment process checklist:

- [DEPLOY_CHECKLIST.md](/Users/archit/Desktop/projects/job-apply/DEPLOY_CHECKLIST.md)

## Quality Checks

Run strict local checks before push/deploy:

```bash
npm run check
```

Individual commands:

```bash
npm run lint
npm run format:check
```

## Database Setup (PostgreSQL)

1. Create a PostgreSQL database (Supabase, Neon, Vercel Postgres, etc.).
2. Run schema SQL from [db/schema.sql](/Users/archit/Desktop/projects/job-apply/db/schema.sql).
3. Set environment variables:
   - `DATABASE_URL`
   - `DATABASE_SSL` (optional, default `true`)

### Vercel env vars

```bash
vercel env add DATABASE_URL production
vercel env add DATABASE_SSL production
```

Redeploy after adding env vars:

```bash
vercel --prod
```

## Conversion Analytics (PostHog)

Analytics tracks the full waitlist funnel with no PII in event payloads:

- `landing_page_view`
- `cta_click`
- `waitlist_submit_started`
- `waitlist_submit_succeeded`
- `waitlist_submit_failed`
- `waitlist_api_success`
- `waitlist_api_duplicate_email`
- `waitlist_api_validation_error`
- `waitlist_api_server_error`

Required env vars:

- `POSTHOG_PUBLIC_KEY`
- `POSTHOG_HOST` (custom/self-hosted base URL)

Add in Vercel:

```bash
vercel env add POSTHOG_PUBLIC_KEY production
vercel env add POSTHOG_HOST production
```

Verification:

1. Open site and click CTAs/form.
2. Submit waitlist once with valid data.
3. Check PostHog live events for frontend + backend event names above.

## LLM Workflow

1. Read `AGENTS.md` for repository rules.
2. Define or update requirements in `docs/SPEC.md`.
3. Track work in `docs/TASKS.md`.
4. Use prompt templates in `prompts/`:
   - `prompts/feature-task.md`
   - `prompts/review-task.md`

## Typical Loop

1. Pick one unchecked task from `docs/TASKS.md`.
2. Make the smallest production-safe change.
3. Verify locally.
4. Commit and deploy with `vercel --prod`.
