# AGENTS.md

This file defines how coding agents should work in this repository.

## Project Goal

Build and ship a simple frontend web app quickly, with small safe iterations and production deploys via Vercel.

## Stack

- Static frontend: HTML, CSS, JavaScript
- Hosting: Vercel
- Version control: Git + GitHub

## Repository Layout

- `index.html`: app entry
- `styles.css`: styling
- `main.js`: behavior
- `docs/SPEC.md`: current product spec
- `docs/TASKS.md`: prioritized task list
- `prompts/`: reusable prompts for LLM-driven development

## Agent Workflow

1. Read `docs/SPEC.md` and `docs/TASKS.md` before coding.
2. Pick the highest-priority unchecked task from `docs/TASKS.md`.
3. Implement the smallest useful change.
4. Run quick checks:
   - Open locally (or static server) and verify no console errors.
   - Ensure mobile layout still works.
5. Update docs:
   - Mark completed tasks in `docs/TASKS.md`.
   - If behavior changed, update `docs/SPEC.md`.
6. Commit with a focused message.

## Coding Rules

- Keep dependencies minimal unless clearly needed.
- Prefer readability over cleverness.
- Avoid large rewrites for small feature requests.
- Preserve existing file structure unless there is a strong reason to change it.
- Keep CSS responsive; test common widths (`360px`, `768px`, desktop).

## Definition of Done

- Feature works in browser.
- No obvious UI regressions.
- Docs updated (`SPEC`/`TASKS` if applicable).
- Changes committed and ready to deploy.

## Deploy

- Preview or prod deploy with Vercel CLI:
  - `vercel`
  - `vercel --prod`
