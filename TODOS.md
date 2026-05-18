# TODOS

Deferred work items captured during planning and review. Each entry has enough
context that someone picking it up months later can act on it without
back-tracing the conversation.

---

## rn-ui i18n follow-ups

Captured during /plan-eng-review on 2026-05-18 for branch `feat/rn-ui-i18n`.
Source design doc: `~/.gstack/projects/DimensionDev-firefly.social/dudu-feat-rn-ui-i18n-design-20260518-111522.md`.

### Exclude `.po` source files from published `dist` — DONE

Resolved in the rn-ui i18n PR via negative `files` globs in `packages/rn-ui/package.json`:
`!src/locales/**/*.po`, `!src/**/__tests__/**`, `!src/**/*.test.*`, `!scripts/**`.
Verified with `npm pack --dry-run`: 204 → 198 files, ~80 KB of .po removed.

### Bundle size assertion CI for rn-ui

- **What:** Add a CI step that measures `packages/rn-ui/dist/` size after build
  and fails or warns if growth exceeds a tuned threshold.
- **Why:** rn-ui is a shared library; silent bundle bloat compounds across every
  consumer. Today there is no leading indicator of size regressions — the team
  only notices when an app feels slow.
- **When to do:** After a few weeks of post-i18n baseline data so the threshold
  can be tuned realistically. Without baseline, a fixed limit produces false
  positives during legitimate growth (adding locales, new components).
- **Owner:** rn-ui maintainer or platform team.
- **Notes:** `rollup-plugin-visualizer` is already in rn-ui devDeps and could
  back the measurement. Consider a Turbo task `size:check`.

### SSR support for rn-ui i18n

- **What:** Add a `setRnUiI18nForServer(locale)` path that calls `setI18n` from
  `@lingui/react/server`, mirroring `apps/wallet/src/i18n/index.ts:61`.
- **Why:** rn-ui is currently scoped to client-render only. If `apps/web`
  (Next.js) starts mounting rn-ui inside a Server Component tree, the current
  setup produces hydration mismatches on every rn-ui-rendered server boundary.
- **When to do:** Conditional. Only kicks in when an apps/web rn-ui integration
  is scheduled.
- **Owner:** whoever owns the apps/web perps integration when it lands.
- **Depends on:** apps/web rn-ui integration timeline being confirmed.

### Approach B upgrade — lazy-loaded catalogs

- **What:** Replace eager catalog imports in `packages/rn-ui/src/i18n/index.ts`
  with dynamic `import()` per active locale. Add suspense/loading state in the
  Provider for the locale-switch window.
- **Why:** Today's footprint is ~25 KB for 5 locales × 30–80 strings — below
  any bundle threshold. Future growth (more components, more locales) will
  eventually pressure this. Approach A was deliberately chosen as forward-
  compatible to Approach B: every line written for A survives the upgrade
  unchanged.
- **When to do:** When TODO-2 (bundle size CI) signals pressure, or when locale
  count grows past ~8 or string count grows past ~500.
- **Owner:** rn-ui maintainer when pressure appears.
- **Notes:** Verify Metro/RN dynamic `import()` semantics in the external RN
  consumer before locking the upgrade path — Metro support for `import()` is
  config-dependent (`inlineRequires`).
