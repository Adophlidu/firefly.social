---
name: implementing-figma-designs
description: Implements Figma designs 1:1 in Firefly using the project's component conventions (apps/web with Tailwind + classNames; apps/wallet with shadcn/ui — Radix primitives + Tailwind + cn; perps surface mounts the whole-screen exports from @dimensiondev/rn-ui). Tamagui is authored only inside the external @dimensiondev/rn-ui package — never in this repo. UI-first with mock data; wire i18n and data afterwards. Use when implementing a Figma node, page, or component into Firefly code. Complements the generic `/figma-implement-design` plugin with Firefly-specific patterns.
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, mcp__plugin_figma_figma__get_design_context, mcp__plugin_figma_figma__get_metadata, mcp__plugin_figma_figma__get_screenshot
---

# Implementing Figma Designs in Firefly

This skill translates Figma designs into Firefly code with high visual fidelity, respecting Firefly's restricted patterns and layer hierarchy.

## Core Principles

### Three-Pass Implementation

1. **UI pass** — pixel-perfect structure and styling with **mock data**. No i18n, no API.
2. **i18n pass** — replace hardcoded strings with Lingui `<Trans>` / ` t` `` macros.
3. **Data pass** — replace mock data with real hooks / services / providers.

Doing all three at once invariably blows up scope and produces stalled work. Land the UI first, then iterate.

During the data pass, consult the **`vercel-react-best-practices`** skill for the relevant patterns: `async-parallel` / `async-suspense-boundaries` when fetching multiple sources, `server-cache-react` / `server-cache-lru` for server components, `client-swr-dedup` for client-side fetching, and the `rerender-*` rules when wiring memoized callbacks.

### What NOT to do (in pass 1)

- Don't worry about where data comes from.
- Don't add Lingui translations yet.
- Don't create API integration or hooks for fetching.
- Don't add complex state management.

### What TO do (in pass 1)

- Hardcode text exactly as shown in Figma.
- Create mock data arrays/objects that match the design.
- Focus on component structure and styling.
- Match spacing, colors, and typography from the design.

## Choosing the Surface

Both apps are **web** today — apps/wallet ships through Vite SSR, not iOS/Android. The "rn-" prefix refers to using the React Native component API (via `react-native-web`), not the deployment target.

**Tamagui is authored only inside the external `@dimensiondev/rn-ui` package** (its own repo `DimensionDev/firefly-rn-ui`, published to GitHub Packages). Nothing in this repo imports from `tamagui` / `@tamagui/*` directly — verified by grep. The Tamagui packages in `apps/wallet/package.json` are present because `@dimensiondev/rn-ui` declares them as **peer dependencies**, not because wallet code imports them.

| Surface                                       | When                                                                      | What you import                                                                                                                                                                                                       | Styling                                                                                            |
| --------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `apps/web` (Next.js 16)                       | Social pages, feeds, modals, profiles                                     | Local components in `apps/web/src/components/` + modals in `apps/web/src/modals/`                                                                                                                                     | Tailwind + `classNames` from `@dimensiondev/utils`                                                 |
| `apps/wallet` (Vite SSR + `react-native-web`) | Wallet, send/receive, transaction flows, perps host shell                 | shadcn/ui primitives in `apps/wallet/src/components/ui/` (Radix-based) + feature composites in `apps/wallet/src/components/`                                                                                          | Tailwind + `cn()` from `@/lib/utils.js`; `lucide-react-native` icons                               |
| `apps/wallet` perps routes                    | `apps/wallet/src/routes/perps.*.tsx`, `apps/wallet/src/components/Perps/` | Whole-screen + provider exports from `@dimensiondev/rn-ui`: `PerpsMarketDetail`, `PerpsTradeDetail`, `TradesHistory`, `Provider`, `PerpsAuthGate`, `PerpsBindingsProvider` (plus type-only `NavigateFunc`, `ToastFn`) | None at this layer — apps/wallet only mounts these screens; all styling is inside rn-ui's tree     |
| `@dimensiondev/rn-ui` (external repo)         | The rn-ui source itself (perps screens + providers) — `DimensionDev/firefly-rn-ui` | **The only place** `tamagui` / `@tamagui/*` and primitives like `XStack`, `YStack`, `SizableText` are imported                                                                                                | Tamagui tokens (`$1`–`$10`, `$text`, `$bg`, `$bodyMd`, …) — authored there, never at consumer sites |

Match the surface to where the design will ship:

- Web page / social feature → `apps/web`.
- Wallet UI that isn't a perps screen → `apps/wallet` shadcn stack.
- A perps screen visual change → contribute to the external `@dimensiondev/rn-ui` repo (`DimensionDev/firefly-rn-ui`), publish, then bump the dependency in apps/wallet. apps/wallet just mounts the screen; it can't restyle what rn-ui exports.
- A new perps screen to add → first decide whether it's a whole screen (build in the `@dimensiondev/rn-ui` repo and export, publish, then mount in apps/wallet) or just an entry point/route shell (a thin file in `apps/wallet/src/routes/perps.*.tsx` that imports the rn-ui screen).

## Workflow

### 1. Read the Figma node

Use `get_design_context` with the `fileKey` and `nodeId` from the Figma URL. The output includes:

- A React + Tailwind reference snippet (NOT final — use as visual reference)
- A screenshot
- Design tokens if any are bound

Use `get_screenshot` if you need to see the design without parsing the snippet.

### 2. Inventory existing components

Before writing new code, search Firefly's existing component library to reuse components.

**For `apps/web`:**

```bash
# List components by name pattern
ls apps/web/src/components/ | grep -i <NAME>

# List modals by name pattern
ls apps/web/src/modals/ | grep -i <NAME>

# Find usages of a component to learn its API
grep -rln "from '@/components/<Component>" apps/web/src/
```

Common reusable building blocks in `apps/web/src/components/`:

- `Avatar`, `AvatarGroup` — user/profile avatars
- `ClickableArea`, `ClickableButton`, `ActionButton` — interaction primitives
- `CopyTextButton`, `ConditionalLink`, `ChainIcon`, `Comeback` — UI primitives
- `Compose/`, `Comments/`, `Article/`, `Channel/`, `ActivityCell/` — feature-area composites

Modals live in `apps/web/src/modals/` and use the **SingletonModal** pattern — open from any layer via `ModalRef.open({})`.

**For `apps/wallet` (default — shadcn / Radix / Tailwind):**

```bash
# shadcn/ui primitives (the building blocks)
ls apps/wallet/src/components/ui/
# → button.tsx, dialog.tsx, drawer.tsx, input.tsx, select.tsx,
#   sonner.tsx, spinner.tsx, switch.tsx, tabs.tsx, tooltip.tsx, ...

# Feature composites (already-assembled wallet UI)
ls apps/wallet/src/components/ | grep -i <NAME>

# Modals
ls apps/wallet/src/modals/ | grep -i <NAME>
```

Imports look like:

```tsx
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog.js';
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs.js';
import { Button } from '@/components/ui/button.js';
import { cn } from '@/lib/utils.js';
```

shadcn's `components.json` is at `apps/wallet/components.json` (style: `new-york`, neutral base, lucide icons). New primitives can be generated via `npx shadcn add <component>` and will land in `src/components/ui/`.

**For `apps/wallet` perps routes — `@dimensiondev/rn-ui` (whole-screen consumption only):**

apps/wallet imports rn-ui's **public surface only** — full perps screens + provider components. You don't author UI inside rn-ui from apps/wallet; you mount what rn-ui exports.

```ts
// Whole perps screens
import {
    PerpsMarketDetail,
    PerpsTradeDetail,
    TradesHistory,
} from '@dimensiondev/rn-ui';

// Provider chain (wraps any subtree that renders rn-ui content)
import {
    Provider,
    PerpsAuthGate,
    PerpsBindingsProvider,
} from '@dimensiondev/rn-ui';

// Types only
import type {
    NavigateFunc,
    ToastFn,
} from '@dimensiondev/rn-ui';
```

The mounting point in apps/wallet today is `apps/wallet/src/components/Perps/PerpsProvider.tsx`. Adding a new perps route means: (a) ensure the screen export exists in the external `@dimensiondev/rn-ui` package (publish it from `DimensionDev/firefly-rn-ui` and bump the dependency), (b) add a thin route file in `apps/wallet/src/routes/perps.*.tsx` that imports it.

**To change anything about how a perps screen looks or behaves, the work lives in the external `@dimensiondev/rn-ui` repo (`DimensionDev/firefly-rn-ui`)** — that's where Tamagui primitives (`XStack`, `YStack`, `SizableText`, etc.) and tokens are authored. apps/wallet can't restyle what rn-ui exports.

### 3. Apply Firefly's styling conventions

#### apps/web — Tailwind + classNames

```tsx
import { classNames } from '@dimensiondev/utils';

// ❌ Forbidden
className={clsx('foo', isActive && 'active')}
className={`foo ${isActive ? 'active' : ''}`}

// ✅ Required
className={classNames('foo', isActive && 'active')}
```

Tailwind classes match the design tokens defined in the project's Tailwind config. Use spacing/color/radius classes (`px-4`, `bg-bg-primary`, `rounded-xl`) rather than inline styles.

#### apps/wallet — Tailwind + `cn`

```tsx
import { cn } from '@/lib/utils.js';
import { Button } from '@/components/ui/button.js';

<Button
    variant="default"
    className={cn('w-full', isLoading && 'opacity-50')}
>
    Submit
</Button>;
```

Notes:

- `cn` comes from `@/lib/utils.js` in apps/wallet (shadcn's convention — `clsx` + `tailwind-merge` under the hood), **NOT** `classNames` from `@dimensiondev/utils`. Don't mix the two.
- Tailwind tokens follow `apps/wallet/tailwind.config.cjs` (neutral base color, CSS variables on). Use semantic tokens like `bg-background`, `text-foreground`, `border` rather than raw color values.
- Icons: `lucide-react-native` (so they render correctly through `react-native-web`). Example: `import { ArrowRight } from 'lucide-react-native';`.
- Safe-area: `tailwindcss-safe-area` plugin provides classes like `pt-safe`, `pb-safe-bottom` for notched displays in PWA mode.

#### `@dimensiondev/rn-ui` (external repo) — Tamagui tokens (the only place Tamagui lives)

If the design you're implementing changes anything about a perps screen's visuals, the work happens in the external `@dimensiondev/rn-ui` repo (`DimensionDev/firefly-rn-ui`). That's where Tamagui primitives and tokens are authored:

```tsx
// Inside the @dimensiondev/rn-ui repo...
import { XStack, YStack, SizableText } from 'tamagui';

<YStack gap="$4">
    <XStack ai="center" gap="$3">
        <SizableText size="$bodyMd">Hello</SizableText>
    </XStack>
</YStack>;
```

Common Tamagui tokens (rn-ui authoring only):

- Spacing: `$1` = 4px, `$2` = 8px, `$3` = 12px, `$4` = 16px, `$5` = 20px, `$6` = 24px, `$8` = 32px, `$10` = 40px
- Color: `$text`, `$textSubdued`, `$textDisabled`, `$bg`, `$bgSubdued`, `$border`, `$icon`
- Font size: `$bodyXs/Sm/Md/Lg`, `$bodyMdMedium`, `$headingXs/Sm/Md/Lg/Xl/Xxl`

After editing the `@dimensiondev/rn-ui` repo, publish a new version and bump `@dimensiondev/rn-ui` in `apps/wallet/package.json` so apps/wallet picks up the change.

**Apps never import `tamagui` or `@tamagui/*` directly.** If you catch yourself wanting `XStack` / `YStack` / `SizableText` in apps/wallet or apps/web, you're in the wrong layer — either restructure as a rn-ui contribution or rebuild with shadcn (apps/wallet) / `apps/web/src/components/` (apps/web).

### 4. Wrap and place the component correctly

- Components in `app/` that use hooks need `'use client'` as the **first line** of the file, then a blank line, then imports.
- Non-trivial components should be wrapped with `memo()` using the named-function form so displayName is preserved:

```tsx
export const NewScreen = memo(function NewScreen(
    props: NewScreenProps,
) {
    // ...
});
```

- Imports use the `@/` alias with `.js` extension. Never relative `../`.
- Never import `next/image`, `next/link`, `next/navigation`, `next/dynamic` directly — use the ESM shims:
    - `@/esm/Image.js`
    - `@/esm/Link.js`
    - `@/esm/navigation.js`
    - `@/esm/dynamic.js`

### 5. Mock data

Hardcode the data exactly as it appears in the design. Co-locate mocks next to the component file or in a `__mocks__/` folder while iterating; remove them in pass 3.

```tsx
const mockPosts = [
    {
        id: '1',
        author: 'alice.eth',
        body: 'Hello world',
        likes: 42,
    },
    {
        id: '2',
        author: 'bob.lens',
        body: 'Just shipped',
        likes: 7,
    },
];
```

### 6. i18n pass (after UI is approved)

Replace hardcoded user-visible strings:

```tsx
import { Trans } from '@lingui/react/macro';
import { t } from '@lingui/core/macro';

<Trans>Sign in</Trans>;
const label = t`Failed to load posts`;
<Trans>Welcome back, {profile.name}</Trans>;
```

Files must live in one of Lingui's scanned directories (`app`, `configs`, `components`, `constants`, `connectors`, `helpers`, `hooks`, `providers`, `modals`, `store`, `services`, `mask`). Otherwise strings won't be extracted.

See `/i18n` for the full workflow including plurals and Tolgee sync.

### 7. Data pass

Wire real data via the appropriate layer:

- API calls / business logic → `apps/web/src/services/` or `providers/`
- React-state-driven data → hooks in `apps/web/src/hooks/`
- Persisted client state → `apps/web/src/store/` (Zustand)

Respect the layer hierarchy:

```
app, components, modals → hooks → services, providers → store → helpers
```

A hook cannot import a component or a modal. A service cannot import a hook. See `/architecture` for the full rules.

## Common Pitfalls

- **Treating apps/wallet like a native RN app.** It's web (Vite SSR + `react-native-web`). No iOS/Android build, no AsyncStorage, no Metro. Standard web storage and browser APIs apply.
- **Importing `tamagui` / `@tamagui/*` / `XStack` / `YStack` / `SizableText` anywhere in `apps/*`.** Tamagui is authored only in the external `@dimensiondev/rn-ui` package. If apps/wallet needs a visual change inside a perps screen, the work happens in the `DimensionDev/firefly-rn-ui` repo (then publish + bump the dependency). Non-perps wallet UI is shadcn.
- **Mixing `classNames` and `cn`.** apps/web uses `classNames` from `@dimensiondev/utils`; apps/wallet uses `cn` from `@/lib/utils.js`. Don't import the other into the wrong app.
- **Mounting a sheet per call site (rn-ui perps).** For shared/triggered-from-many-places sheets, mount **one global instance** in the perps `Provider.tsx` subtree and trigger via a jotai atom in `store/tradeForm.ts`. Don't mount per-callsite.
- **Wrong `<Trans>` import path.** Must be `@lingui/react/macro` (or `@lingui/core/macro` for JS). Importing from `@lingui/macro` will silently break extraction.
- **Hardcoded class strings via template literals.** ESLint will reject. Use `classNames(...)` in apps/web or `cn(...)` in apps/wallet.
- **Forgetting `.js` extension** on `@/` imports — ESLint will reject.
- **Adding `'use client'`** to a page component that doesn't need it. Pages should stay server components unless they use hooks/event handlers. Note: apps/wallet is SPA-style under Vite SSR — `'use client'` is a Next.js (apps/web) concept and doesn't apply to apps/wallet.
- **`'use client'` not on the first line** of the file (apps/web only).
- **Reaching into `@dimensiondev/rn-ui` internals** directly. Always import from the published export paths (`@dimensiondev/rn-ui`, `/perps`, `/provider`).
- **Trying to author new components inside `@dimensiondev/rn-ui` to satisfy an apps/wallet design**, when the design isn't actually part of the perps surface. Build it as shadcn in `apps/wallet/src/components/` instead.
