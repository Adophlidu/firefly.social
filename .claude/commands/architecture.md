# Firefly Architecture & Layer Rules

> **Authoritative source for layer rules.** CLAUDE.md only summarizes; this file is the canonical reference.

Detailed guide for the import layer hierarchy enforced by ESLint.

## Workspace Package Layers

```
Layer 0 (no @dimensiondev deps):
  @dimensiondev/utils
  @dimensiondev/types
  @dimensiondev/assets

Layer 1 (Layer 0 only):
  @dimensiondev/constants
  @dimensiondev/envs
  @dimensiondev/hooks
  @dimensiondev/web3
  @dimensiondev/web3-utils
  @dimensiondev/native-bridge
  @dimensiondev/iframe-bridge

Layer 2 (Layer 0 + 1):
  apps/web
  apps/wallet
```

**Rule**: Layer 1 packages must NOT import sibling Layer 1 packages.

```ts
// ❌ VIOLATION: @dimensiondev/hooks importing @dimensiondev/web3
import { foo } from '@dimensiondev/web3';

// ✅ FIX: Move shared logic to @dimensiondev/utils (Layer 0)
import { foo } from '@dimensiondev/utils';
```

## In-App Layers (apps/web/src)

```
HIGH (can import anything below)
  app/               — Next.js pages, layouts, API routes
  components/        — React UI components
  modals/            — Modal components (use SingletonModal pattern)
        ↓
  hooks/             — React hooks
        ↓
  services/          — Business logic
  providers/         — Multi-network providers (bsky, farcaster, lens, etc.)
        ↓
  store/             — Zustand stores
        ↓
  helpers/           — Pure utility functions
LOW (cannot import anything above)
```

## Common Violations & Fixes

**Store importing a hook:**

```ts
// ❌ VIOLATION: src/store/usePostStore.ts
import { useProfile } from '#/hooks/useProfile.js';

// ✅ FIX: Move the logic into a helper or call from a hook instead
// Store should only contain state and actions, not consume hooks
```

**Hook importing a component:**

```ts
// ❌ VIOLATION: src/hooks/useComposeModal.ts
import { ComposeModal } from '#/components/ComposeModal.js';

// ✅ FIX: Use the modal ref pattern instead
import { ComposeModalRef } from '#/modals/ComposeModal/refs.js';
// Then: ComposeModalRef.open({})
```

**Service importing a hook:**

```ts
// ❌ VIOLATION: src/services/FireflySession.ts
import { useCurrentProfile } from '#/hooks/useCurrentProfile.js';

// ✅ FIX: Pass data as parameters, or read from store directly
import { useCurrentProfileStore } from '#/store/useCurrentProfileStore.js';
const profile =
    useCurrentProfileStore.getState().currentProfile;
```

## Modal Pattern (avoids layer violations)

All modals use `SingletonModal` so any layer can open them without importing the component:

```ts
// src/modals/FooModal/refs.ts
import { SingletonModal } from '#/libs/SingletonModal.js';
export interface FooModalOpenProps {
    id: string;
}
export const FooModalRef = new SingletonModal<
    FooModalOpenProps,
    void
>();

// Open from anywhere (store, service, hook, component):
import { FooModalRef } from '#/modals/FooModal/refs.js';
FooModalRef.open({ id: 'xyz' });
```

## Import Rules (apps/web)

- ✅ Use `#/` (or legacy `@/`) alias with `.js` extension: `import { x } from '#/helpers/foo.js'`
- ❌ No relative paths: `import { x } from '../../helpers/foo'`
- ❌ No `next/image`, `next/link`, `next/navigation` — use ESM shims in `#/esm/`

## Enforcing

Run `pnpm lint` — ESLint will report layer violations as errors.
Custom rules in `rules/eslint-import-architecture-zones.mjs` and `rules/eslint-package-layer-boundaries.mjs`.
