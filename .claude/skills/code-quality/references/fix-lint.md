# Fix Lint — Firefly

Per-ESLint-rule fix recipes for firefly. Use when `pnpm lint` (or `npx eslint .`) reports warnings/errors.

Firefly uses **ESLint 9 flat config** with these plugins (root `package.json` devDependencies):

- `@next/eslint-plugin-next` — Next.js rules
- `@typescript-eslint/eslint-plugin` — TypeScript rules
- `eslint-config-next` — Next.js config preset
- `eslint-plugin-import` + `eslint-import-resolver-typescript` — import correctness
- `eslint-plugin-no-relative-import-paths` — forbids relative `../` imports
- `eslint-plugin-react` + `eslint-plugin-react-hooks` — React rules
- `eslint-plugin-simple-import-sort` — auto-sortable import order
- `eslint-plugin-storybook` — Storybook rules
- `eslint-plugin-tailwindcss` — Tailwind class validation + ordering
- `eslint-plugin-unicorn` — opinionated correctness rules
- `eslint-plugin-unused-imports` — replaces `no-unused-vars` for imports
- Custom rules: `rules/eslint-import-architecture-zones.mjs` (in-app layer enforcement) and `rules/eslint-package-layer-boundaries.mjs` (workspace Layer 0/1/2 enforcement)

## Workflow

### Step 1: Run ESLint and look at the output

```bash
# Whole project (matches CI)
pnpm lint 2>&1 | tail -100

# Single file (fastest)
npx eslint apps/web/src/components/Foo.tsx

# Auto-fix what's auto-fixable
npx eslint . --fix --cache --cache-location .eslintcache
```

Many rules (`simple-import-sort/imports`, `tailwindcss/classnames-order`, `unused-imports/no-unused-imports`, formatting) are auto-fixed by `--fix`. Run that first; the remainder needs manual attention.

### Step 2: Categorize and fix

| Category                  | Rule                                                | Auto-fix?  | Fix strategy                                  |
| ------------------------- | --------------------------------------------------- | ---------- | --------------------------------------------- |
| Unused imports            | `unused-imports/no-unused-imports`                  | ✅         | Remove the import                             |
| Unused vars               | `unused-imports/no-unused-vars`                     | ❌         | Prefix with `_` or remove                     |
| Relative imports          | `no-relative-import-paths/no-relative-import-paths` | ❌         | Replace with `@/` alias + `.js`               |
| Floating promises         | `@typescript-eslint/no-floating-promises`           | ❌         | `void` or `await`                             |
| Import sort               | `simple-import-sort/imports`                        | ✅         | `--fix`                                       |
| Tailwind class order      | `tailwindcss/classnames-order`                      | ✅         | `--fix`                                       |
| Custom Tailwind class     | `tailwindcss/no-custom-classname`                   | ❌         | Fix typo, switch to valid class, or whitelist |
| React hooks deps          | `react-hooks/exhaustive-deps`                       | ⚠️ partial | Add missing dep, or extract callback          |
| Layer-zone violation      | `firefly/import-architecture-zones` (or similar)    | ❌         | Restructure imports (see `/architecture`)     |
| Workspace layer violation | `firefly/package-layer-boundaries` (or similar)     | ❌         | Move shared code to a lower layer             |

### Step 3: Verify

```bash
npx eslint <file>      # confirm clean
pnpm typecheck         # confirm no type regression
```

---

## Per-Rule Fix Recipes

### `unused-imports/no-unused-imports`

Auto-fixable. Just run `--fix`. If you need to keep the import for side effects only, use a side-effect-only import (no specifier):

```typescript
// ❌ unused named import
import { Foo, sideEffect } from 'lib';
// → after --fix:
import { sideEffect } from 'lib';

// If you need just the side effect, no specifier:
import 'lib/register';
```

### `unused-imports/no-unused-vars`

Not auto-fixable. Three patterns:

```typescript
// Unused function parameter — prefix with _
function handler(event: MouseEvent, _options: Options) { ... }

// Unused destructured property — rename to _name
const { wanted, ignored: _ignored } = props;

// Unused local variable — prefix with _ (or remove if pointless)
const _diagnostic = compute();   // intentionally kept for debugging
```

Don't fake-use a variable with `void _x` — that's noise. If you don't need it, remove it.

### `no-relative-import-paths/no-relative-import-paths`

Replace `../` with `@/` and add the `.js` extension:

```typescript
// ❌
import { foo } from '../../helpers/foo';

// ✅
import { foo } from '@/helpers/foo.js';
```

This applies to **all** `@/` imports in apps/web and apps/wallet — see `/architecture` for the alias setup. The `.js` extension is mandatory under firefly's ESM TS config; ESLint will reject without it.

### `@typescript-eslint/no-floating-promises`

```typescript
// ❌ — Promise floats; if it rejects, the rejection is unhandled
storeSession(user);

// ✅ fire-and-forget: explicitly mark with void
void storeSession(user);

// ✅ wait for the result
await storeSession(user);

// ✅ chain a catch if you want to log but not block
storeSession(user).catch((error) => {
    console.error('Failed to store session', error);
});
```

Use `void` deliberately — it documents the intent ("I know this is async, I don't want to await"). If a teammate flips the function from `void` to `await` later, that's a code-review conversation, not a hidden bug.

### `simple-import-sort/imports`

Auto-fixable. Sort order is: side-effect imports → external packages → `@/`-aliased internal imports → relative imports (which should not exist; see above). Use `npx eslint <file> --fix` and it does the right thing.

### `tailwindcss/classnames-order`

Auto-fixable. Runs Tailwind's recommended order. `npx eslint <file> --fix`.

### `tailwindcss/no-custom-classname`

ESLint thinks a class isn't a valid Tailwind class. Three causes:

1. **Typo** — fix the class name.
2. **Real custom class** (defined in `globals.css`) — whitelist it in `apps/web/eslint.config.*` (or wherever the plugin is configured) under `tailwindcss.whitelist`, then re-run.
3. **Plugin-provided class** (e.g. `tailwindcss-safe-area`, `tailwindcss-animate`) — ensure the plugin is registered in the relevant `tailwind.config.cjs`. If it is and ESLint still complains, the plugin's `tailwindConfig` setting may be pointing at the wrong config file.

### `react-hooks/exhaustive-deps`

Suppressing with `// eslint-disable-next-line react-hooks/exhaustive-deps` is a code smell. Prefer one of:

```typescript
// 1. Add the missing dep
useEffect(() => {
    fetchData(query);
}, [query]); // ✅ include query

// 2. Move the value into a ref if it shouldn't trigger re-runs
const queryRef = useRef(query);
queryRef.current = query;
useEffect(() => {
    fetchData(queryRef.current);
}, []); // ✅ ref reads stay out of deps

// 3. Extract the callback so it's stable
const fetchOnce = useCallback(
    () => fetchData(query),
    [query],
);
useEffect(() => {
    fetchOnce();
}, [fetchOnce]);
```

If you're 100% sure suppressing is correct, leave a one-line **Why** comment explaining the invariant — see the comment-discipline section in `SKILL.md`.

### `react/no-unstable-nested-components`

Extract the component above the parent:

```typescript
// ❌ — recreates the component every render
function Parent() {
  const Item = () => <li>...</li>;
  return <ul><Item /></ul>;
}

// ✅
function Item() { return <li>...</li>; }
function Parent() {
  return <ul><Item /></ul>;
}
```

If you genuinely need closure over parent state, wrap with `useCallback` returning JSX is wrong — pass a prop or use a render-prop pattern, or just refactor so the child is a true sibling.

### Layer-zone violations (custom rule: `eslint-import-architecture-zones`)

Errors look like: "Import from `@/hooks/useFoo.js` not allowed in `@/store/bar.ts` — store cannot depend on hooks." See `/architecture` for the full layer diagram.

Fix strategies:

- **Store importing a hook** → move the logic into a helper (`@/helpers/*`) or call it from the hook layer.
- **Hook importing a component or modal** → use the `SingletonModal` ref pattern (see `/architecture`).
- **Service or provider importing a hook** → read from the store directly (`useFooStore.getState()`), or accept the data as a parameter.

### Workspace layer violations (custom rule: `eslint-package-layer-boundaries`)

Errors look like: "Layer 1 package `@dimensiondev/hooks` cannot import from sibling Layer 1 package `@dimensiondev/web3`." See `/architecture` for the workspace layer diagram.

Fix: move the shared logic to a Layer 0 package (typically `@dimensiondev/utils`, `@dimensiondev/types`, or `@dimensiondev/assets`).

```typescript
// ❌ In @dimensiondev/hooks/src/foo.ts
import { something } from '@dimensiondev/web3';

// ✅ Move `something` into @dimensiondev/utils, then:
import { something } from '@dimensiondev/utils';
```

### `unicorn/*` rules

`eslint-plugin-unicorn` is opinionated. Common encounters:

- `unicorn/no-array-for-each` — use `for...of` instead of `.forEach()` when the body is not a simple transform.
- `unicorn/no-null` — usually configured off in firefly; if you hit it, prefer `undefined` only when the API allows it.
- `unicorn/prefer-node-protocol` — `import fs from 'node:fs'` instead of `'fs'`.
- `unicorn/filename-case` — match the project's casing convention (PascalCase for components, kebab-case for everything else).

When a unicorn rule conflicts with project convention, **don't disable in-line**. File a discussion to disable the rule in the eslint config so the convention is consistent.

---

## When ESLint and `pnpm typecheck` disagree

ESLint can't see across packages the way `tsgo` does. If `pnpm lint` is happy but `pnpm typecheck` fails, trust typecheck — fix the type error.

If `pnpm typecheck` is happy but `pnpm lint` errors on a type-related rule (e.g. `@typescript-eslint/no-unsafe-*`), trust the lint rule — typecheck verifies soundness, lint enforces additional safety on top.

---

## After Fixing

```bash
# Re-run the same scope you fixed
npx eslint <files>            # specific files
pnpm lint --filter=<package>  # one package
pnpm lint                     # whole project (matches CI)

# Then re-check types in case the fix changed shapes
pnpm typecheck
```

If you used `--fix`, also run `git diff` to confirm only the intended files changed.
