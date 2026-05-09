# @dimensiondev/rn-ui

React Native UI for Firefly perps flows (Tamagui). Built as a library with **peer dependencies** so hosts dedupe a single copy of Tamagui, Jotai, React Query, Hyperliquid, etc.

## Peer dependencies

The host app **must** install the packages listed under `peerDependencies` in [package.json](./package.json) at compatible versions (copy the version ranges from that file). Notable entries:

- `tamagui`, `@tamagui/core`, `@tamagui/config`, `@tamagui/lucide-icons-2`
- `jotai`, `jotai-tanstack-query`, `jotai-effect`
- `@tanstack/react-query`
- `@nktkas/hyperliquid`
- `lucide-react-native`, `react-native-svg`
- `bignumber.js`, `urlcat`, `@dimensiondev/utils`

## Entry points and bundle size

- **Full API**: `@dimensiondev/rn-ui` — re-exports provider, perps screens, and `tamagui`.
- **Lighter shell**: `@dimensiondev/rn-ui/provider` — `Provider`, `config`, and shared types only (smaller graph than the full entry).
- **Perps screens only**: `@dimensiondev/rn-ui/perps` — `PerpsMarketDetail`, `PerpsTradeDetail`, `TradesHistory`.

Published `dist` splits shared chunks (e.g. perps UI vs provider). Prefer the subpath that matches what you import.

`package.json` sets `"react-native"` under `exports` so Metro can resolve **TypeScript source** in `src/` when you enable package exports (see below).

## Analyze bundle output

From this package:

```bash
pnpm run build:analyze
```

Open `dist/stats.html` (after build) for a Rollup treemap (gzip/brotli sizes). `dist/` is gitignored; run the command locally when investigating regressions.

## Metro (standalone React Native app)

This repo’s iframe wallet uses Vite + `react-native-web` instead of Metro. For a **native** app in another repo or workspace package:

1. Add `@dimensiondev/rn-ui` and **all** peer dependencies to the app.
2. In `metro.config.js`, include the monorepo package root in `watchFolders` if you consume it via `workspace:`.
3. Prefer resolving **`react-native` condition** from `exports` so Metro compiles `src/` and the app bundler can tree-shake (similar to `apps/wallet` resolving `src/index.ts` via Vite alias).

Example pattern:

```js
// metro.config.cjs
const path = require('node:path');
const {
    getDefaultConfig,
    mergeConfig,
} = require('@react-native/metro-config');
const monorepoRoot = path.resolve(__dirname, '../..');

const config = {
    watchFolders: [
        path.join(monorepoRoot, 'packages/rn-ui'),
    ],
    resolver: {
        unstable_enablePackageExports: true,
        // Prefer "react-native" / "import" conditions from package.json exports
        resolverMainFields: [
            'react-native',
            'browser',
            'main',
        ],
    },
};

module.exports = mergeConfig(
    getDefaultConfig(__dirname),
    config,
);
```

Adjust `watchFolders` to the actual path of `packages/rn-ui` on disk.

## Runtime performance (not the same as npm tarball size)

Large JS downloads are only one input to perceived performance. If the UI still feels slow after fixing bundle externals:

1. **Profile the JS thread** (React Native Profiler, Flipper, or Xcode Instruments) during order book and list scroll.
2. **Virtualize long lists** (FlashList / `VirtualizedList`) for market lists and history; avoid rendering hundreds of rows as plain `ScrollView` children.
3. **WebSocket / book updates**: `useOrderBook` already coalesces updates with a requestAnimationFrame throttle; if you add similar hooks, avoid calling `setState` on every raw tick.
4. **Defer heavy routes**: use `React.lazy` / dynamic `import()` for perps screens so the initial route does not parse the whole module graph at once.

## Web / `react-native-web` hosts

Map `react-native` to `react-native-web` in the bundler (see `apps/wallet` Vite `resolve.alias`). Ensure the same peer versions as a native app so Jotai and React Query share one instance with `@dimensiondev/rn-ui`.
