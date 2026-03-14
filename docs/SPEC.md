# Product Spec

## Product
Landing page + waitlist for a one-click graduate jobs platform.

## Positioning
- Core promise: Apply to grad jobs in one click.
- MVP audience: Accounting university students pursuing graduate roles.
- Geography focus (MVP): Australia.

## Current Behavior
- Presents value proposition and CTA-driven sales page.
- Explains 3-step flow:
  1. Create profile once
  2. Browse aggregated listings
  3. Apply in one click
- Includes waitlist form collecting:
  - Name
  - Email
- Performs client-side validation and stores entries in browser `localStorage`.

## Functional Requirements
- App loads without build step.
- Works on modern mobile and desktop browsers.
- Deployed and accessible on Vercel.
- Form has accessible labels and live status feedback.

## Non-Goals (current stage)
- Live backend waitlist storage
- Authenticated user accounts
- Real one-click application submission flow
- Job source integrations

## Next Feature Areas
- Connect waitlist form to backend (API/database)
- Add social proof and partner logos
- Add role/location filters mock for future product preview
- Add analytics events for CTA and form conversion
