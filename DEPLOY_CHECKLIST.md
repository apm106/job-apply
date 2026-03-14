# Deploy Checklist

## Pre-Deploy

- [ ] Confirm branch is up to date with `main`.
- [ ] Confirm clean working tree: `git status` shows no uncommitted changes.
- [ ] Run quality checks:
  - [ ] `npm ci`
  - [ ] `npm run check`
- [ ] Verify required production env vars are present in Vercel:
  - [ ] `DATABASE_URL`
  - [ ] `DATABASE_SSL` (optional; default true)

## Deploy

- [ ] Run production deploy:
  - [ ] `vercel --prod`
- [ ] Confirm Vercel reports deployment success.
- [ ] Confirm production alias points to latest deployment:
  - [ ] `https://job-apply-eta.vercel.app`

## Post-Deploy Validation

- [ ] Open homepage and verify main sections render correctly.
- [ ] Submit waitlist form and confirm success message.
- [ ] Smoke test waitlist API:
  - [ ] `curl -X POST https://job-apply-eta.vercel.app/api/waitlist -H 'content-type: application/json' --data '{"name":"Deploy Check","email":"deploy-check-TIMESTAMP@example.com"}'`
  - [ ] Expect HTTP `201` and JSON body containing `{"ok":true}`.
- [ ] Record deployment inspect URL in PR or release notes.
