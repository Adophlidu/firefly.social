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

CI blocks on: typecheck, lint, vitest, cspell, conventional commits.

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

## Git

- **Base branch**: `main`
- **Commit format**: `feat(scope): description` / `fix(scope):` / `chore(scope):`
- ❌ NEVER commit directly to `main` or `released` — create a feature branch first (`feat/...`, `fix/...`, etc.)
- ❌ Do NOT include AI tool attribution lines in commit messages
- cspell checks commit messages — add new technical terms to `cspell.json`

## Debugging

- After a fix the user reports as not working, do NOT retry the same approach with minor tweaks. Re-analyze the root cause from scratch and propose a fundamentally different approach.
- When the user reports a visual bug, confirm the specific platform and expected vs. actual behavior before attempting a fix. Never assume the root cause.

## Skills Reference

For detailed guidance, invoke these commands:

- `/commit` — Pre-checked commit workflow with conventional commit format
- `/architecture` — Full layer rules with violation examples and fixes
- `/i18n` — Lingui workflow, plurals, Tolgee sync
- `/rn-ui` — `@dimensiondev/rn-ui` entry points, Provider setup, peer deps

## Agent skills

### Issue tracker

Issues are tracked in Jira at `mask.atlassian.net` with `FW-XXXX` keys, via the Atlassian MCP tools. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage state is applied as Jira labels using the default label vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
