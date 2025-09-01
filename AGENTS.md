# Repository Guidelines

## Project Structure & Module Organization
- `src/`: Application code (modules, components, CLI).
- `tests/`: Unit/integration tests mirror `src/` layout.
- `scripts/`: Developer utilities (setup, lint, release).
- `assets/`: Static files (images, sample data).
- `docs/`: Design notes and usage guides.

Keep modules small and cohesive. Co-locate tests next to code or under `tests/` with matching paths (e.g., `src/utils/date.ts` → `tests/utils/date.test.ts`).

## Build, Test, and Development Commands
- `make setup`: Install tools/dependencies if a Makefile exists.
- `make build` / `npm run build`: Produce a production build or distributable.
- `make test` / `npm test`: Run the test suite with coverage when configured.
- `make lint` / `npm run lint`: Lint and static analysis.
- `make dev` / `npm run dev`: Start local dev server/watch mode.

If a Makefile is absent, prefer `package.json` scripts or `scripts/` helpers (PowerShell/bash).

## Coding Style & Naming Conventions
- Indentation: 2 spaces for JS/TS; 4 spaces for Python.
- Naming: PascalCase for classes/types; camelCase for functions/vars; kebab-case for file names (JS/TS) and snake_case for Python.
- Formatting/Linting: Use Prettier + ESLint (JS/TS) or Black + Ruff/Flake8 (Python). Run via `make fmt` or `npm run format` when available.
- Keep functions focused; prefer pure utilities and small modules.

## Testing Guidelines
- Framework: Jest/Vitest (JS/TS) or Pytest (Python), depending on module language.
- Layout: `tests/` mirrors `src/`; name tests as `*.test.(ts|js)` or `test_*.py`.
- Coverage: Target ≥80% on changed code; run with `npm test -- --coverage` or `make coverage` when available.

## Commit & Pull Request Guidelines
- Commits: Follow Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`). Keep messages imperative and scoped (e.g., `feat(api): add pagination to list endpoint`).
- PRs: Provide a clear summary, link related issues, include screenshots for UI changes, list breaking changes and migration notes, and add test coverage for new behavior.

## Security & Configuration Tips
- Never commit secrets. Use `.env.local` for developer machines and `.env.example` to document required variables.
- Review third-party licenses and pin dependencies where possible.
