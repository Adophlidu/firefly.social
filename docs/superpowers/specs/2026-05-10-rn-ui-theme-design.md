# rn-ui Theme Configuration Design

**Date:** 2026-05-10
**Scope:** `packages/rn-ui`
**Goal:** Add light / dark theme support to rn-ui, following the token naming structure of app-monorepo.

---

## Background

`packages/rn-ui` currently uses the default `@tamagui/config/v3` configuration. Components rely entirely on hardcoded colors (e.g. `#171717`, `rgba(70,70,70,0.8)`) without any semantic tokens, so they cannot respond to theme changes.

`app-monorepo` already has a complete light/dark semantic token system (`bg`, `text`, `textSubdued`, `border`, etc.), but its color values belong to the OneKey visual system. Since rn-ui follows the Firefly Perps design, those values cannot be copied verbatim.

The approach taken here: **reuse app-monorepo's token naming convention, build the light palette from rn-ui's existing hardcoded values, and derive a corresponding dark palette.**

---

## Design

### 1. Color Token Architecture

Add a `src/colors/` directory:

```
packages/rn-ui/src/colors/
  light.ts    # lightColors — semantic tokens for light mode
  dark.ts     # darkColors  — semantic tokens for dark mode
  index.ts    # re-export
```

#### Token Table

| Token               | Light                 | Dark                    | Description                                  |
| ------------------- | --------------------- | ----------------------- | -------------------------------------------- |
| `bg`                | `#FFFFFF`             | `#171717`               | Primary background                           |
| `bgSubdued`         | `#F8F7F9`             | `#1E1E1E`               | Secondary background (cards, sheet sections) |
| `bgHover`           | `#EDEEF2`             | `#252525`               | Hover/press background; skeleton placeholder |
| `bgCriticalSubdued` | `#FFE6E4`             | `#2D1515`               | Loss/warning subdued background              |
| `text`              | `#171717`             | `#F0F0F0`               | Primary text                                 |
| `textSubdued`       | `rgba(70,70,70,0.8)`  | `rgba(220,220,220,0.7)` | Secondary text                               |
| `textDisabled`      | `rgba(70,70,70,0.4)`  | `rgba(220,220,220,0.4)` | Disabled / very faint text                   |
| `textTertiary`      | `#A9A6BC`             | `#6B6B8A`               | Tertiary text (labels, helper copy)          |
| `textSuccess`       | `#429F37`             | `#48AD3C`               | Profit/long/positive text                    |
| `textCritical`      | `#FF372B`             | `#FF564D`               | Loss/short/error text                        |
| `border`            | `#F0F0F0`             | `#2D2D2D`               | Primary divider/border                       |
| `borderSubdued`     | `rgba(34,33,47,0.15)` | `rgba(255,255,255,0.1)` | Subtle border/divider                        |
| `accent`            | `#5E69FF`             | `#818BFF`               | Accent (blue)                                |
| `orange`            | `#F7931A`             | `#F7931A`               | Special use (e.g. Bitcoin icon)              |

> Minor variants such as `#FF564D`, `#48AD3C`, `#FF3C33` that appear in components all map to `textCritical` / `textSuccess`; no separate tokens are introduced for them.

---

### 2. tamagui.config.ts Update

Keep `@tamagui/config/v3` as the base (fonts, animations, size/space/radius tokens) and overlay the custom color themes on top:

```ts
import { config as configV3 } from '@tamagui/config/v3';
import {
    createTamagui,
    type TamaguiInternalConfig,
} from 'tamagui';

import { darkColors, lightColors } from './colors';

export const config: TamaguiInternalConfig = createTamagui({
    ...configV3,
    defaultTheme: 'light',
    themes: {
        light: { ...configV3.themes.light, ...lightColors },
        dark: { ...configV3.themes.dark, ...darkColors },
    },
});

export type Conf = typeof config;

declare module 'tamagui' {
    interface TamaguiCustomConfig extends Conf {}
}

export default config;
```

---

### 3. Provider Update

**Add a `theme` prop**, typed as `'light' | 'dark' | 'system'`, replacing the previous `defaultTheme` inherited from `TamaguiProviderProps`.

```tsx
interface ProviderProps {
    token: string | null;
    apiMode?: 'prod' | 'dev';
    children?: ReactNode;
    walletClient?: WalletClient;
    toast: ToastFn;
    navigate: NavigateFunc;
    theme?: 'light' | 'dark' | 'system'; // new, defaults to 'system'
}
```

`'system'` is resolved internally via `useColorScheme()`:

```ts
const colorScheme = useColorScheme();
const resolvedTheme: 'light' | 'dark' =
    theme === 'light' || theme === 'dark'
        ? theme
        : colorScheme === 'dark'
          ? 'dark'
          : 'light';
```

Pass it to `TamaguiProvider`:

```tsx
<TamaguiProvider config={config} defaultTheme={resolvedTheme}>
```

`ProviderProps` no longer extends `TamaguiProviderProps`; the interface is now an explicit, internally-defined shape.

---

### 4. Component Color Migration

A total of 56 files contain hardcoded colors. Two replacement patterns are used.

#### Pattern 1: Static JSX props (vast majority)

```tsx
// before
<Text color="#171717" />
<XStack backgroundColor="#F8F7F9" borderColor="#F0F0F0" />

// after
<Text color="$text" />
<XStack backgroundColor="$bgSubdued" borderColor="$border" />
```

#### Pattern 2: Runtime dynamic colors (useTheme)

For cases where a color value must be computed in JS (e.g. PnL coloring, dynamic styles):

```tsx
// before
const priceColor = positive ? '#429F37' : '#FF372B';

// after
const theme = useTheme();
const priceColor = positive
    ? theme.textSuccess.get()
    : theme.textCritical.get();
```

#### Full hex → token mapping

| Hardcoded value                               | Tamagui token                      |
| --------------------------------------------- | ---------------------------------- |
| `#171717` / `#181818` / `#000000`             | `$text`                            |
| `rgba(70,70,70,0.8)` / `rgba(70,70,70,0.80)`  | `$textSubdued`                     |
| `rgba(70,70,70,0.4)` / `rgba(70,70,70,0.40)`  | `$textDisabled`                    |
| `#464646` / `#403D57`                         | `$text` (close to primary text)    |
| `#A9A6BC` / `#9EA1B0`                         | `$textTertiary`                    |
| `#429F37` / `#48AD3C`                         | `$textSuccess`                     |
| `#FF372B` / `#FF564D` / `#FF3C33`             | `$textCritical`                    |
| `#FFFFFF`                                     | `$bg`                              |
| `#F8F7F9` / `#F1F2F5` / `#EFEFF3`             | `$bgSubdued`                       |
| `#EDEEF2` / `#E8E8E8`                         | `$bgHover`                         |
| `rgba(34,33,47,0.03)` / `rgba(34,33,47,0.08)` | `$bgHover` (very faint background) |
| `#FFE6E4`                                     | `$bgCriticalSubdued`               |
| `#F0F0F0`                                     | `$border`                          |
| `rgba(34,33,47,0.15)` / `rgba(0,0,0,0.06)`    | `$borderSubdued`                   |
| `#5E69FF`                                     | `$accent`                          |
| `#F7931A`                                     | `$orange`                          |

> **Skeletons**: placeholder background colors (`#E8E8E8`, `#EDEEF2`) all map to `$bgHover`.

---

## File Change Summary

| Action | Path                                            |
| ------ | ----------------------------------------------- |
| Add    | `src/colors/light.ts`                           |
| Add    | `src/colors/dark.ts`                            |
| Add    | `src/colors/index.ts`                           |
| Modify | `src/tamagui.config.ts`                         |
| Modify | `src/components/Providers/Provider.tsx`         |
| Modify | `src/components/**/*.tsx` (~46 component files) |
| Modify | `src/skeletons/**/*.tsx` (10 skeleton files)    |
| Modify | `src/ui/**/*.tsx` (~6 page files)               |

---

## Out of Scope

- Custom font/animation tokens (still inherit from `@tamagui/config/v3` defaults)
- Theme persistence (handled by the host app; rn-ui only consumes the `theme` prop)
- Other visual tweaks to `ButtonUI`, `SearchInput`, `UnstyledInput`, etc.
