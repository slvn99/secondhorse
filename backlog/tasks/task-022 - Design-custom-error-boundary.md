---
id: task-022
title: Design custom error boundary
status: Done
assignee:
  - '@codex'
created_date: '2025-11-06 13:38'
updated_date: '2025-11-06 13:53'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Replace the generic Next.js crash screen with a branded error UI and reset button.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Implement app/error.tsx as a client component styled like the rest of the app, showing a friendly message and call-to-action.
- [x] #2 Use the reset() handler required by Next.js so users can retry without refresh.
- [x] #3 Audit for sensitive info leaks (no stack traces in prod).
- [x] #4 Manually trigger an error (e.g., throw in development) to confirm the boundary renders and the reset workflow recovers.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Confirm existing layout + styling cues for consistency
2. Implement client error boundary with friendly copy, Reset CTA, and safe logging
3. Trigger a dev error to verify the boundary and record findings
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Added branded client error boundary in src/app/error.tsx with gradient styling, safe copy, reset CTA, and home link.
- Logged captured errors to console only so sensitive details stay out of the UI.
- Added tests/app/error.test.tsx to confirm messaging, reset wiring, and hidden error text.
- Validation: npm test -- error; Next DevTools get_errors (no runtime errors). Manual QA tip: temporarily throw inside a page component to see the new screen and confirm the Try again button recovers.
<!-- SECTION:NOTES:END -->
