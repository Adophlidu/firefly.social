---
name: code-quality
description: Firefly code-quality standards — lint (ESLint 9 flat config via Turbo), type check (tsgo), tests (Vitest), comment conventions, naming, single responsibility, avoiding over-abstraction. Use when writing new code, refactoring, fixing lint warnings, or preparing changes for commit. All comments must be English.
allowed-tools: Read, Grep, Glob, Bash
---

# Firefly Code Quality

Linting, type checking, testing, comments, and general code-quality standards for firefly. Apply when authoring code; consult before committing.

## Verification Commands

The three checks firefly's CI gates on:

```bash
pnpm typecheck    # tsgo --noEmit, via Turbo (fast)
pnpm lint         # ESLint 9 flat config, via Turbo
pnpm test         # Vitest (apps/web/tests/, packages/*/test/)
```

There is **no** husky / lint-staged setup in firefly. The fast path for local pre-commit is either:

```bash
# Whole project (Turbo caches per package — repeat runs are very fast)
pnpm typecheck && pnpm lint

# Or target a specific app/package while iterating
pnpm typecheck --filter=@dimensiondev/firefly-web
pnpm lint --filter=@dimensiondev/firefly-web
```

For a single file you just changed:

```bash
# Just the lint rules on one file
npx eslint apps/web/src/components/Foo.tsx

# Just type-check the project containing one file
cd apps/web && npx tsgo --noEmit
```

The `/commit` slash command runs `pnpm typecheck` + `pnpm lint` before producing a commit — you usually don't need to run these manually if you use `/commit`.

## Restricted Patterns (canonical sources)

Don't duplicate the rules here — read the authoritative docs and use ESLint to enforce them:

- **Layer hierarchy** (in-app and workspace package layers, SingletonModal pattern, common violations) → `/architecture`
- **Import paths** (`@/` alias with `.js` extension, no relative `../`, no `next/image`/`next/link`/`next/navigation` direct) → `CLAUDE.md` + `/architecture`
- **Class names** (`classNames` from `@dimensiondev/utils` in apps/web, `cn` from `@/lib/utils.js` in apps/wallet; no `clsx`, no template literals) → `CLAUDE.md`
- **Client/server components** (`'use client'` as the first line + blank line, then imports) → `CLAUDE.md`
- **i18n** (Lingui macros from `@lingui/react/macro` and `@lingui/core/macro` — NOT `@lingui/macro`) → `/i18n`
- **rn-ui imports** (whole-screen + Provider only from the external `@dimensiondev/rn-ui` package; tamagui is never authored in this repo) → `CLAUDE.md` (Tamagui boundary)
- **Commit format** (conventional commits, `FW-XXX` Jira key, no AI attribution) → `/commit`

If a rule is unclear or ESLint reports it without context, open the canonical source above before guessing.

## Common Lint Fixes (quick)

The full per-rule recipes are in [references/fix-lint.md](references/fix-lint.md). The quickest fixes:

```typescript
// Unused import — remove (eslint-plugin-unused-imports / unused-imports/no-unused-imports)
import { Used, Unused } from 'package';     // ❌
import { Used } from 'package';             // ✅

// Unused variable — prefix with underscore (unused-imports/no-unused-vars)
const { used, unused } = obj;                          // ❌
const { used, unused: _unused } = obj;                 // ✅
function foo(used: string, unused: number) { ... }     // ❌
function foo(used: string, _unused: number) { ... }    // ✅

// Floating promise — add void or await (@typescript-eslint/no-floating-promises)
someAsync();          // ❌
void someAsync();     // ✅ fire-and-forget
await someAsync();    // ✅ wait for result

// Relative import — use @/ alias (no-relative-import-paths/no-relative-import-paths)
import { x } from '../../helpers/foo';        // ❌
import { x } from '@/helpers/foo.js';         // ✅ with .js extension

// Tailwind class order — auto-fixable (tailwindcss/classnames-order)
className="text-sm px-4 flex"   // ❌ unordered
className="flex px-4 text-sm"   // ✅ (or run --fix)

// Import sort — auto-fixable (simple-import-sort/imports)
npx eslint <file> --fix
```

Auto-fix what's auto-fixable in one go:

```bash
npx eslint . --fix --cache --cache-location .eslintcache
```

## Comment Conventions

**All comments must be in English** (memory: `feedback_docs_language.md` — committed markdown must be English; the same rule applies to code comments).

```typescript
// ✅ GOOD: English comment
// Use the cached profile when offline; otherwise refetch.

// ❌ BAD: Chinese comment
// 离线时使用缓存的资料；否则重新获取。

// ✅ GOOD: JSDoc in English
/**
 * Resolves a handle to a profile across all configured networks.
 * @param handle - User handle (e.g., `alice.lens`, `bob.eth`)
 * @returns Resolved profile, or null if no match
 */
async function resolveProfile(handle: string): Promise<Profile | null> { ... }
```

### Core rules

1. **Don't add unnecessary comments.** They make the code verbose without adding value.
2. **The code should explain itself — this is the first priority.** Prefer clear names and structure over a comment that compensates for unclear code.
3. **Comment only when something genuinely needs clarifying.**
4. **When you do comment, keep it simple and concise.**

### When to write a comment

Default to **no comments**. Only add one when the WHY is non-obvious: a hidden constraint, a subtle invariant, a workaround for a specific bug, behavior that would surprise a reader.

```typescript
// ✅ GOOD: explains a non-obvious choice
// Lens requires the address checksum lowercased — their indexer rejects EIP-55.
const lensAddress = address.toLowerCase();

// ✅ GOOD: explains a workaround
// Bluesky returns 200 with empty body during cold-start — treat as "not ready" and retry.
if (!response.body) return { ready: false };

// ❌ BAD: restates what the code says
// Set isLoading to false
setIsLoading(false);

// ❌ BAD: references the current task / PR / author
// Added to fix FW-1234 — used by the new compose flow
```

Don't reference the current task, fix, or callers ("used by X", "added for the Y flow", "handles the case from issue #123"). Those belong in the PR description and rot as the codebase evolves.

Don't commit commented-out code. If it might be useful later, it's in git history.

## Development Principles

### Single responsibility

Each low-level function does one thing. Compose at the call site.

```typescript
// ✅ GOOD
async function fetchProfile(
    handle: string,
): Promise<Profile> {
    const network = detectNetwork(handle);
    return network.providers.profile.get(handle);
}

// ❌ BAD: mixes fetch, state, notification, analytics
async function fetchProfileAndUpdateUI(handle: string) {
    const profile =
        await detectNetwork(handle).providers.profile.get(
            handle,
        );
    setProfileState(profile);
    Toast.success({ title: 'Profile loaded' });
    trackEvent('profile_loaded');
}
```

### No premature abstraction

A bug fix doesn't need surrounding cleanup; a one-shot operation doesn't need a helper. Three similar lines is better than a premature abstraction. Don't design for hypothetical future requirements.

```typescript
// ❌ BAD: helper for one call site
const createUserFetcher =
    (config: Config) => (id: string) =>
        fetchWithConfig(config, `/users/${id}`);
const fetchUser = createUserFetcher(defaultConfig);
const user = await fetchUser(id);

// ✅ GOOD: just do it
const user = await fetch(`/api/users/${id}`).then((r) =>
    r.json(),
);
```

### No defensive code for impossible states

Don't add error handling, fallbacks, or validation for scenarios that can't happen. Trust internal code and framework guarantees. Only validate at system boundaries (user input, external APIs).

```typescript
// ❌ BAD: the function literally just returned, the type guarantees non-null
const profile = await getProfile(id);
if (!profile) throw new Error('Profile is null???');

// ✅ GOOD: trust the type. If it can return null, handle it; if not, don't.
const profile = await getProfile(id);
```

### Consistent naming

```typescript
// Boolean variables: is/has/should/can prefix
const isLoading = true;
const hasPermission = false;
const shouldRefresh = true;
const canEdit = false;

// Event handlers: handle prefix
const handleSubmit = () => {};
const handlePress = () => {};

// Async actions: verb describing the action
async function fetchProfile() {}
async function publishPost() {}
async function refreshSession() {}

// React components: PascalCase, wrapped with memo() if non-trivial
export const PostCard = memo(function PostCard(props: PostCardProps) { ... });
```

## Checklist

Before opening a PR:

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes (or `npx eslint . --fix --cache` then re-check)
- [ ] `pnpm test` passes for touched packages
- [ ] All comments are in English
- [ ] No commented-out code
- [ ] No relative `../` imports; `@/` imports include `.js` extension
- [ ] No `clsx` / template-literal class names (apps/web uses `classNames`, apps/wallet uses `cn`)
- [ ] No direct `next/image` / `next/link` / `next/navigation` / `next/dynamic` imports
- [ ] User-visible strings wrapped with Lingui macros (`<Trans>` / ` t` ``)
- [ ] Non-trivial components wrapped with `memo(function Name() { ... })`
- [ ] `'use client'` is the first line of the file (apps/web client components only)
- [ ] No tamagui imports anywhere in this repo (tamagui lives only in the external `@dimensiondev/rn-ui` package)

## Detailed Guides

- [references/fix-lint.md](references/fix-lint.md) — per-ESLint-rule fix recipes (firefly's plugins: layer zones, no-relative-import-paths, tailwindcss, simple-import-sort, unused-imports, react-hooks, etc.)

## Related Skills

- `/architecture` — layer rules (canonical)
- `/i18n` — Lingui workflow (canonical)
- `/commit` — pre-commit workflow + conventional commit format
- `code-review-pr` — reviewer-side companion (same rule set, applied from the reviewer's POV)
- `vercel-react-best-practices` — Vercel's React/Next.js performance rules; consult when writing React/Next.js code that touches data fetching, bundling, or re-renders
