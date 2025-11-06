---
id: task-014
title: Make clean scripts work cross-platform
status: Done
assignee:
  - '@codex'
created_date: '2025-11-06 08:47'
updated_date: '2025-11-06 09:05'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
npm run clean and npm run reset depend on bash scripts and Unix tools (rm, find) via scripts/clean.sh, which fails for contributors on Windows without Git Bash. Introduce a cross-platform implementation (e.g. Node-based) so cache cleanup works everywhere.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Replace or wrap scripts/clean.sh with a cross-platform cache cleanup that runs on Windows shells.
- [x] #2 Update package.json scripts (clean/reset) to use the cross-platform helper.
- [x] #3 Document the new cleanup workflow in README or scripts/clean.sh comments.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
$1. Implement a Node-based cleanup helper that removes cache artefacts cross-platform.
2. Update package scripts (clean/reset) to use the new helper and add a reset runner.
3. Refresh documentation to mention the new Node helpers and verify the commands.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
$- Added scripts/clean.mjs and scripts/reset.mjs to replace the bash-only cleanup flow and wrapped reset with retry handling for Windows locks.
- Updated package.json, README.md, and AGENTS.md to reference the new cross-platform helpers.
- Verified commands and project health: npm run clean; npm run reset; npm run lint; npm test
<!-- SECTION:NOTES:END -->
