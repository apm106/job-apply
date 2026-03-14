# Product Spec

## Product

Landing page + waitlist + secure auth foundations for a one-click graduate jobs platform.

## Positioning

- Core promise: Apply to grad jobs in one click.
- Current audience: Accounting university students pursuing graduate roles.
- Geography focus: Australia.

## Current Behavior

- Presents value proposition and CTA-driven sales page.
- Captures waitlist entries (name + email).
- Provides auth entry points (signup/login) from landing page.
- Supports secure authentication via Supabase:
  - Email/password signup + login
  - Google OAuth start + callback
  - HttpOnly cookie session management
  - CSRF checks on state-changing auth routes
  - Rate limiting on signup/login
- Includes protected `/account.html` page that redirects unauthenticated users and shows authenticated user placeholder details:
  - `user_id`
  - `email`
  - `created_at`
  - `providers`

## Functional Requirements

- App loads without build step.
- Works on modern mobile and desktop browsers.
- Deployed and accessible on Vercel.
- Auth tokens are never stored in localStorage/sessionStorage.

## Non-Goals (current stage)

- Full job aggregation and one-click applications
- Rich profile/dashboard experience
- Role-based access control
