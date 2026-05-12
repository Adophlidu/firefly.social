# Firefly-Specific Patterns

Patterns enforced by Firefly's ESLint config, code review conventions, and `CLAUDE.md`.

## 1. Layer Hierarchy

See `/architecture` for the canonical rules. Quick reference:

### Workspace package layers (`@dimensiondev/*`)

```
Layer 0 (no @dimensiondev deps):
  @dimensiondev/utils, @dimensiondev/types, @dimensiondev/assets
       ↓
Layer 1 (Layer 0 only):
  @dimensiondev/constants, /envs, /hooks, /web3, /web3-utils,
  /native-bridge, /iframe-bridge, /rn-ui
       ↓
Layer 2:
  apps/web, apps/wallet
```

**Rule**: Layer 1 packages must NOT import sibling Layer 1 packages. If shared logic is needed, move it to a Layer 0 package (typically `@dimensiondev/utils`).

```typescript
// ❌ VIOLATION: @dimensiondev/hooks importing @dimensiondev/web3
import { foo } from '@dimensiondev/web3';

// ✅ FIX: Move shared logic to @dimensiondev/utils
import { foo } from '@dimensiondev/utils';
```

### In-app layers (`apps/web/src`)

```
HIGH (can import anything below):
  app/, components/, modals/
       ↓
  hooks/
       ↓
  services/, providers/
       ↓
  store/
       ↓
  helpers/
LOW (cannot import anything above)
```

### Common violations

**Store importing a hook:**

```typescript
// ❌ VIOLATION: src/store/usePostStore.ts
import { useProfile } from '@/hooks/useProfile.js';

// ✅ FIX: Move the logic into a helper or call it from the hook layer
```

**Hook importing a component or modal:**

```typescript
// ❌ VIOLATION: src/hooks/useComposeModal.ts
import { ComposeModal } from '@/components/ComposeModal.js';

// ✅ FIX: Use the SingletonModal ref pattern
import { ComposeModalRef } from '@/modals/ComposeModal/refs.js';
ComposeModalRef.open({});
```

**Service or provider importing a hook:**

```typescript
// ❌ VIOLATION: src/services/FireflySession.ts
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';

// ✅ FIX: Read from the store directly, or accept the data as a parameter
import { useCurrentProfileStore } from '@/store/useCurrentProfileStore.js';
const profile =
    useCurrentProfileStore.getState().currentProfile;
```

## 2. Modal Pattern (SingletonModal)

All modals use `SingletonModal` so any layer can open them without importing the component:

```typescript
// src/modals/FooModal/refs.ts
import { SingletonModal } from '@/libs/SingletonModal.js';
export interface FooModalOpenProps {
    id: string;
}
export const FooModalRef = new SingletonModal<
    FooModalOpenProps,
    void
>();

// Open from anywhere (store, service, hook, component):
import { FooModalRef } from '@/modals/FooModal/refs.js';
FooModalRef.open({ id: 'xyz' });
```

**Memory rule (from `feedback_rn_ui_sheet_location.md`)**: For shared/triggered-from-many-places sheets in `apps/wallet`, mount ONE global instance in `Provider.tsx` and use a jotai atom in `store/tradeForm.ts`. Do NOT mount the sheet per-callsite.

## 3. Import Rules

| Rule                                           | Bad                                           | Good                                              |
| ---------------------------------------------- | --------------------------------------------- | ------------------------------------------------- |
| Use `@/` alias, never relative `../`           | `import { x } from '../../helpers/foo'`       | `import { x } from '@/helpers/foo.js'`            |
| Always include `.js` extension on `@/` imports | `import { x } from '@/helpers/foo'`           | `import { x } from '@/helpers/foo.js'`            |
| Never import `next/image` directly             | `import Image from 'next/image'`              | `import Image from '@/esm/Image.js'`              |
| Never import `next/link` directly              | `import Link from 'next/link'`                | `import Link from '@/esm/Link.js'`                |
| Never import `next/navigation` directly        | `import { useRouter } from 'next/navigation'` | `import { useRouter } from '@/esm/navigation.js'` |
| Never import `next/dynamic` directly           | `import dynamic from 'next/dynamic'`          | `import dynamic from '@/esm/dynamic.js'`          |

## 4. Class Names

```typescript
// ❌ FORBIDDEN
import clsx from 'clsx';
className={clsx('foo', isActive && 'active')};

// ❌ FORBIDDEN — template literal
className={`foo ${isActive ? 'active' : ''}`};

// ✅ REQUIRED
import { classNames } from '@dimensiondev/utils';
className={classNames('foo', isActive && 'active')};
```

## 5. Components

### `'use client'` placement

For client components in `app/`:

```typescript
'use client';                              // FIRST line

import { useState } from 'react';          // blank line, then imports
import { Foo } from '@/components/Foo.js';

export const MyComponent = memo(function MyComponent() { ... });
```

- Never add `'use client'` to a server component that doesn't need it.
- Never add `'use client'` after a comment or import — directive must be the first line.

### `memo()` wrapping

Wrap non-trivial components with `memo()` using the named-function form so the displayName is preserved:

```typescript
export const Foo = memo(function Foo(props: FooProps) {
    // ...
});
```

## 6. i18n (Lingui)

See `/i18n` for the full workflow. Quick rules:

- ❌ NEVER hardcode user-visible strings.
- ✅ JSX: `<Trans>text</Trans>` from `@lingui/react/macro`.
- ✅ JS: `` t`text` `` from `@lingui/core/macro`.
- ❌ NEVER import from `@lingui/macro` (wrong package for this project).
- ❌ NEVER manually edit non-English `.po` files or any `messages.ts` — they're managed by Tolgee and the `pnpm lingui` CI step.

```typescript
// JSX
import { Trans } from '@lingui/react/macro';
<Trans>Sign in</Trans>

// JS
import { t } from '@lingui/core/macro';
const label = t`Failed to load posts`;

// With variables
<Trans>Welcome back, {profile.name}</Trans>
```

Strings in files outside the Lingui scope (`app`, `configs`, `components`, `constants`, `connectors`, `helpers`, `hooks`, `providers`, `modals`, `store`, `services`, `mask`) will NOT be extracted. If you need to translate a string in another directory, move it into one of those.

## 7. UI stacks across firefly

Firefly has three distinct UI stacks with strict boundaries:

| Surface               | Stack                                                                                                                 | Where Tamagui lives                                   |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `apps/web`            | Next.js 16 + Tailwind + `classNames` from `@dimensiondev/utils`                                                       | —                                                     |
| `apps/wallet`         | Vite SSR + `react-native-web` + **shadcn/ui** (Radix in `src/components/ui/`) + Tailwind + `cn` from `@/lib/utils.js` | — (only mounts rn-ui screens; doesn't author Tamagui) |
| `packages/rn-ui/src/` | React Native API + Tamagui (`XStack`, `YStack`, `SizableText`, tokens like `$1`–`$10`, `$bodyMd`, `$text`)            | **Here, exclusively**                                 |

**Tamagui rule (verifiable by grep):** `tamagui` and `@tamagui/*` are imported **only** inside `packages/rn-ui/src/`. Neither `apps/web/src/` nor `apps/wallet/src/` imports them — verify with `grep -r "from ['\"]\(tamagui\|@tamagui/\)" apps/`. The Tamagui packages present in `apps/wallet/package.json` are there because rn-ui declares them as **peer dependencies**.

### apps/wallet's two valid import paths into the perps subtree

apps/wallet consumes `@dimensiondev/rn-ui` only at the **public surface** — whole screens + provider components:

| Import shape         | Examples                                                 |
| -------------------- | -------------------------------------------------------- |
| Whole-screen exports | `PerpsMarketDetail`, `PerpsTradeDetail`, `TradesHistory` |
| Provider chain       | `Provider`, `PerpsAuthGate`, `PerpsBindingsProvider`     |
| Type-only            | `NavigateFunc`, `ToastFn`                                |

The mounting point today is `apps/wallet/src/components/Perps/PerpsProvider.tsx`. Adding new perps visuals = work inside `packages/rn-ui/src/`, then `pnpm build` rn-ui, then mount the new export in a thin apps/wallet route file.

### `@dimensiondev/rn-ui` entry points

See `/rn-ui` for the full setup. Quick rules:

| Entry point                    | What it exports                              |
| ------------------------------ | -------------------------------------------- |
| `@dimensiondev/rn-ui`          | re-exports perps + provider + all of tamagui |
| `@dimensiondev/rn-ui/perps`    | Perps UI screens only                        |
| `@dimensiondev/rn-ui/provider` | `Provider`, `config`, types                  |

- ❌ **NEVER** point `package.json` exports to `src/`. Consumers can't resolve `@/` aliases inside the package; the published `dist/` has them rewritten. (apps/wallet uses Vite, not Metro — same constraint: import from package exports, not source.)
- After making changes to `packages/rn-ui/src/`, run `pnpm build` in that package before apps/wallet picks them up.
- `Provider` is required around any subtree that renders rn-ui content, **not** at the app root.

### Common review flags

- ❌ **Any** import from `tamagui` or `@tamagui/*` inside `apps/`. Tamagui authoring belongs in `packages/rn-ui/src/`.
- ❌ Importing `XStack`, `YStack`, `SizableText`, or any Tamagui-derived re-export from `@dimensiondev/rn-ui` into apps/. apps/wallet should only import whole screens + providers from rn-ui.
- ❌ Using `classNames` (from `@dimensiondev/utils`) inside apps/wallet — should be `cn` from `@/lib/utils.js`.
- ❌ Using `cn` from `@/lib/utils.js` inside apps/web — should be `classNames` from `@dimensiondev/utils`.
- ❌ Reaching into `packages/rn-ui/src/*` directly. Always import from `@dimensiondev/rn-ui` (or `/perps`, `/provider`).
- ❌ Treating apps/wallet as native (no `AsyncStorage`, no Expo APIs, no Metro-only assumptions).

## 8. Build & CI

Firefly CI blocks on:

| Check        | Workflow                      | What it runs                         |
| ------------ | ----------------------------- | ------------------------------------ |
| `typecheck`  | `typecheck.yml`               | `npm run typecheck` (tsgo via turbo) |
| `eslint`     | `eslint.yml`                  | `npx eslint . --quiet --cache`       |
| `test`       | `test.yaml`                   | `pnpm run test` (Vitest)             |
| `spellcheck` | `cspell.yml`                  | `npx cspell --no-progress "**/*"`    |
| `validate`   | `conventional-commits.yml`    | PR title conventional commit format  |
| `publish`    | `jira-issue-key-checking.yml` | PR title contains `FW-XXX`           |

If a PR changes `.github/workflows/*.yml`, review the change carefully for:

- Removed checks (loss of coverage).
- Added secrets / changed permissions.
- New external actions that haven't been vetted.

## 9. Common Anti-Patterns to Flag

- Direct `next/image` / `next/link` / `next/navigation` import → use ESM shim.
- `clsx` / `cx` / template-literal `className` → use `classNames`.
- Relative `../` imports → use `@/` alias with `.js`.
- Missing `'use client'` directive in a file that uses hooks under `app/`.
- `'use client'` not on the first line.
- Non-trivial component not wrapped in `memo()`.
- Hardcoded English string in JSX/TS without Lingui macro.
- Wrong Lingui macro import path (`@lingui/macro` instead of `@lingui/react/macro` or `@lingui/core/macro`).
- Layer-hierarchy violation (see § 1).
- Sheet/modal mounted per-callsite instead of globally in `Provider.tsx`.
