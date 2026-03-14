# Basic Frontend Webapp

A static waitlist + auth-ready web app deployed on Vercel.

## Repo

- GitHub: `https://github.com/apm106/job-apply`

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

## Deploy to Vercel

```bash
vercel --prod
```

Deployment process checklist:

- [DEPLOY_CHECKLIST.md](/Users/archit/Desktop/projects/job-apply/DEPLOY_CHECKLIST.md)

## Quality checks

```bash
npm run check
npm test
npm run test:e2e
```

## Database setup (PostgreSQL)

1. Create PostgreSQL database.
2. Run schema SQL from [db/schema.sql](/Users/archit/Desktop/projects/job-apply/db/schema.sql).
3. Set env vars:
   - `DATABASE_URL`
   - `DATABASE_SSL` (optional)

## Conversion analytics (minimal PostHog)

Tracked frontend events:

- `landing_page_view`
- `waitlist_submit_started`
- `waitlist_submit_succeeded`

Required env vars:

- `POSTHOG_PUBLIC_KEY`
- `POSTHOG_HOST`

## Authentication setup (Supabase)

### Required env vars

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `APP_BASE_URL`
- `AUTH_COOKIE_DOMAIN` (optional)

### Supabase dashboard configuration

1. Enable Email + Password auth.
2. Enable Google provider.
3. Enable email confirmation requirement.
4. Add redirect URLs:
   - Local: `http://localhost:3000/api/auth/callback`
   - Production: `https://job-apply-eta.vercel.app/api/auth/callback`

### Auth endpoints

- `GET /api/auth/csrf`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/oauth/start`
- `GET /api/auth/callback`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Auth pages

- `GET /auth.html` for signup/login
- `GET /account.html` protected placeholder account page
