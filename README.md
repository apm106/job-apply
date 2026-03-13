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
