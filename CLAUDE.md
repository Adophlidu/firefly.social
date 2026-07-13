# CLAUDE.md

Project-specific guidelines for AI-assisted development on Firefly.

## Repository Overview

Firefly is a multi-chain Web3 social platform (Next.js 16 / React 19) supporting Farcaster, Bluesky, Lens, and EVM/Solana wallets. The monorepo uses pnpm workspaces + Turbo; the primary app is `apps/web`.

## Verification Commands

Run these before claiming work is done.

```bash
pnpm typecheck        # uses tsgo, not tsc
pnpm lint             # ESLint 9 flat config via Turbo
pnpm test             # Vitest; test files in apps/web/tests/
```

To run a single test file (faster than the full suite):

```bash
pnpm --filter @dimensiondev/firefly-web exec vitest run tests/<path>
```

CI blocks on: typecheck, lint, vitest, conventional commits.

## Other Commands

```bash
pnpm dev:apps         # dev servers for apps/* (web on next dev --turbo)
pnpm test:e2e         # Playwright e2e (output in test-results/, gitignored)
pnpm lingui           # extract/compile i18n catalogs
```

Package manager is pinned via `packageManager`: `pnpm@11.5.3` — do not use npm/yarn.

## Architecture

ESLint enforces a strict layer hierarchy — violations fail lint:

- **Workspace**: Layer 1 packages must NOT import sibling Layer 1 packages
- **In-app**: lower layers (helpers → store → services/providers → hooks → components/modals) must NOT import higher layers

See `/architecture` for the full layer diagram, package list, violation examples, and fixes.

## Restricted Patterns

**Imports:**

- ❌ NEVER use relative paths (`../`) for internal imports — ESLint forbids them
- ✅ All `@/` internal imports require `.js` extension: `import { Foo } from '@/components/Foo.js'`
- ❌ NEVER import `next/image` / `next/link` / `next/navigation` directly
- ✅ Use ESM shims: `@/esm/Image.js`, `@/esm/Link.js`, `@/esm/navigation.js`, `@/esm/dynamic.js`
- ❌ NEVER use `clsx`, `cx`, or template literals for class names
- ✅ Use `classNames(...)` from `@dimensiondev/utils`

**Components:**

- ❌ NEVER add `'use client'` to page components in `app/` unless required
- ✅ Client components: `'use client'` as **first line**, then a **blank line**, then imports
- ✅ Wrap non-trivial components with `memo()`: `export const Foo = memo(function Foo(props) { ... })`

**Tamagui boundary:**

- ❌ NEVER import from `tamagui` or `@tamagui/*` inside `apps/wallet` or `apps/web`
- ✅ Tamagui lives only inside the external `@dimensiondev/rn-ui` package (its own repo: `DimensionDev/firefly-rn-ui`, published to GitHub Packages)
- ✅ Apps consume Tamagui-based UI through `@dimensiondev/rn-ui` exports (whole-screen components, hooks, `Provider`)
- Reason: workspaces resolved different Tamagui versions (`1.114.0` vs `1.144.4`), so mixing in-app Tamagui with rn-ui's `Provider` loaded two Tamagui copies at runtime, causing React error #321 in production (`/perp-kline-chart`). Keeping Tamagui inside one package eliminates the version-split foot-gun.

**i18n:**

- ❌ NEVER hardcode user-visible strings without i18n wrapping
- ✅ JSX: `<Trans>text</Trans>` from `@lingui/react/macro`
- ✅ JS: `` t`text` `` from `@lingui/core/macro`

## Code Maintainability

- **Search before writing**: before adding a helper or component, search `apps/web/src/helpers/` and `apps/web/src/components/` for an existing implementation. Extend what exists instead of duplicating it.
- ❌ NEVER use `as any`. `@ts-expect-error` requires a trailing comment explaining why.
- ❌ NEVER add a new npm dependency without explicit user approval.
- ✅ New helpers in `apps/web/src/helpers/` need a matching test in `apps/web/tests/helpers/`.
- For features spanning multiple files, present a short plan and get approval before writing code.

## Git

- **Base branch**: `origin/main`
- **Commit format**: `feat(scope): description` / `fix(scope):` / `chore(scope):`
- ❌ NEVER commit directly to `origin/main` or `released` — create a feature branch first (`feat/...`, `fix/...`, etc.)
- ❌ Do NOT include AI tool attribution lines in commit messages
- ✅ Before creating a PR, run a code review pass on the diff (`/code-review`, or the `code-review-pr` skill for the full Firefly checklist) and fix confirmed findings first
- ✅ PR bodies must follow `.github/PULL_REQUEST_TEMPLATE.md` (`Closes FW-XXXX` first line, Description, Screenshots for visual changes, the `Ready?` checklist). Passing `--body` to `gh pr create` overrides GitHub's auto-fill, so reproduce the template yourself. Never check the "Manually verified" box without user confirmation.

## Debugging

- After a fix the user reports as not working, do NOT retry the same approach with minor tweaks. Re-analyze the root cause from scratch and propose a fundamentally different approach.
- When the user reports a visual bug, confirm the specific platform and expected vs. actual behavior before attempting a fix. Never assume the root cause.

## Skills Reference

For detailed guidance, invoke these commands:

- `/commit` — Pre-checked commit workflow with conventional commit format
- `/architecture` — Full layer rules with violation examples and fixes
- `/i18n` — Lingui workflow, plurals, Tolgee sync

## Agent skills

Note: `docs/agents/` is gitignored (local-only). If a referenced file is absent in your checkout, proceed without it — do not flag it or try to create it.

### Issue tracker

Issues are tracked in Jira at `mask.atlassian.net` with `FW-XXXX` keys, via the Atlassian MCP tools. Details in `docs/agents/issue-tracker.md` (if present).

### Triage labels

Triage state is applied as Jira labels using the default label vocabulary. Details in `docs/agents/triage-labels.md` (if present).

### Domain docs

If `CONTEXT.md` or `docs/adr/` exist at the repo root, read the relevant parts before exploring; if absent, proceed silently. Details in `docs/agents/domain.md` (if present).
