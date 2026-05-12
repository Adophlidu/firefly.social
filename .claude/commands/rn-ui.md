# @dimensiondev/rn-ui Usage Guide

React Native UI components for Firefly (Perps trading interface). Built with Tamagui.

## Entry Points

The package exports three sub-paths:

```ts
// Main: re-exports perps + provider + all of tamagui
import { ... } from '@dimensiondev/rn-ui';

// Perps UI screens only
import { PerpsMarketDetail, PerpsTradeDetail, TradesHistory } from '@dimensiondev/rn-ui/perps';

// Provider + config + types only
import { Provider, config } from '@dimensiondev/rn-ui/provider';
import type { ... } from '@dimensiondev/rn-ui/provider';
```

## IMPORTANT: Import from dist, not src

The `react-native` export condition points to `./dist/` (NOT `./src/`).

**Why**: The source uses `@/` path aliases that Metro bundler cannot resolve. The compiled `dist/` has all aliases resolved to real paths and is plain JavaScript — Metro handles it without any extra configuration.

❌ Do NOT change `package.json` exports to point to `src/` — this breaks Metro.

## Provider Setup

Wrap your app root with `Provider` from `@dimensiondev/rn-ui/provider`:

```tsx
import {
    Provider,
    config,
} from '@dimensiondev/rn-ui/provider';

export default function App() {
    return (
        <Provider
            token="<hyperliquid-auth-token>"
            apiMode="prod" // or "dev"
        >
            {/* your app */}
        </Provider>
    );
}
```

`Provider` sets up: Hyperliquid WebSocket client, TanStack Query, TamaguiProvider, Jotai atoms for navigation and toast.

## Required Peer Dependencies

```json
{
    "@tamagui/config": "^1.114.0",
    "@tamagui/core": "^1.114.0",
    "@tanstack/react-query": "^5.85.9",
    "jotai": "^2.19.1",
    "jotai-effect": "^2.2.3",
    "jotai-tanstack-query": "^0.11.0",
    "react-native": "*",
    "react-native-svg": "*",
    "tamagui": "^1.114.0"
}
```

## Tamagui Config

The package exports its own Tamagui config:

```ts
import { config } from '@dimensiondev/rn-ui/provider';
// Use this as your TamaguiProvider config if you don't have a custom one
```

## Key Exports

| Export              | Entry       | Description                         |
| ------------------- | ----------- | ----------------------------------- |
| `PerpsMarketDetail` | `/perps`    | Coin market with kline + order book |
| `PerpsTradeDetail`  | `/perps`    | Trade execution interface           |
| `TradesHistory`     | `/perps`    | Historical trade records            |
| `Provider`          | `/provider` | App root provider                   |
| `config`            | `/provider` | Tamagui configuration               |
| All Tamagui exports | `/`         | Re-exported from `tamagui`          |

## Building

```bash
cd packages/rn-ui
pnpm build      # compile src/ → dist/ (Vite)
pnpm dev        # watch mode
pnpm typecheck  # tsgo --noEmit
```

After making changes to `rn-ui`, run `pnpm build` before the consuming RN app can pick them up.
