# @dimensiondev/rn-ui

React Native UI for Firefly perps flows (Tamagui). Built as a library with **peer dependencies** so hosts dedupe a single copy of Tamagui, Jotai, React Query, Hyperliquid, etc.

## Peer dependencies

The host app **must** install the packages listed under `peerDependencies` in [package.json](./package.json) at compatible versions (copy the version ranges from that file). Notable entries:

- `tamagui`, `@tamagui/core`, `@tamagui/config`, `@tamagui/helpers`, `@tamagui/lucide-icons-2`
- `jotai`, `jotai-tanstack-query`, `jotai-effect`
- `@tanstack/react-query`
- `@nktkas/hyperliquid`
- `lucide-react-native`, `react-native-svg`
- `bignumber.js`, `urlcat`, `@dimensiondev/utils`

## Entry points and bundle size

- **Full API**: `@dimensiondev/rn-ui` — re-exports provider, perps screens, and `tamagui`.
- **Lighter shell**: `@dimensiondev/rn-ui/provider` — `Provider`, `PerpsBindingsProvider`, `PerpsAuthGate`, `config`, default `queryClient` / `queryClientConfig`, and shared types (smaller graph than the full entry).
- **Perps screens only**: `@dimensiondev/rn-ui/perps` — `PerpsMarketDetail`, `PerpsTradeDetail`, `TradesHistory`.

Published `dist` splits shared chunks (e.g. perps UI vs provider). Prefer the subpath that matches what you import.

### Provider composition

- **Jotai isolation** — rn-ui uses a **dedicated** `createStore()` instance (exported as `store` from the package’s store module), not the host process default store. **`Provider`** and **`PerpsBindingsProvider`** both mount `JotaiProvider` with that same `store` so atom hooks and imperative `store.get` / `store.set` stay aligned. Nested `JotaiProvider` with the same `store` reference is safe. Host `JotaiProvider` / host atoms remain separate.
- **`Provider`** — `QueryClientProvider` (optional **`queryClient`**) → `TamaguiProvider` → **`JotaiProvider`** → `children`. Tamagui + RQ shell only; perps wiring is still composed separately.
- **`PerpsBindingsProvider`** — **`JotaiProvider`** (same `store`) → sync effects (`token`, `apiMode`, `walletClient`, `toast`, `navigate`, Hyperliquid clients). Wrap **outside or inside** `Provider` depending on Tamagui/RQ reuse; typical wallet order: `PerpsBindingsProvider` → `Provider` → `PerpsAuthGate` → routes.
- **`PerpsAuthGate`** — reads `sessionTokenAtom`; must sit under an rn-ui `JotaiProvider` (as in the example). Renders `LoginFallback` when unauthenticated.

Example (Firefly wallet): `PerpsBindingsProvider` → `Provider` → `PerpsAuthGate` → routes.

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

### Tamagui compile-time optimization (Vite / Metro)

Tamagui’s static extractor runs in the **host** bundler (not inside the published `dist/` graph by default). It rewrites `.tsx` that imports Tamagui primitives and may inject imports such as `@tamagui/helpers`, so the host must resolve those packages at the **same Tamagui minor** as `tamagui` (mismatched `@tamagui/core` vs `tamagui` breaks the extractor’s `require()` of the bundled config).

**Vite (see `apps/wallet/vite.config.ts`):**

- Add dev dependency `@tamagui/vite-plugin` aligned with `tamagui` (e.g. `1.114.0`).
- Register `tamaguiPlugin({ optimize: true, disableResolveConfig: true, config: '<absolute-or-repo-relative>/packages/rn-ui/src/tamagui.config.ts', components: ['tamagui'] })` **before** `@vitejs/plugin-react`. Use `disableResolveConfig: true` when the app already aliases `react-native` / `react-native-svg` for RNW.
- Pin `tamagui`, `@tamagui/core`, `@tamagui/config`, and `@tamagui/helpers` to the same release line (exact versions avoid pnpm resolving `^1.114.0` to a newer `@tamagui/core` that breaks `setupHooks` during extraction).
- Ensure `@tamagui/helpers` is a **direct** dependency of the host (or linked workspace package) so injected imports resolve when compiling `packages/rn-ui/src` via alias.

**Verification:** a successful production client build logs lines such as `TradesHistory · 13 found · 12 opt · 10 flat` (found / optimized / flattened views). Compare gzip size of client chunks with `optimize: true` toggled off if you need a quantitative A/B.

**Metro (native app):** use `@tamagui/babel-plugin` with `config` pointing at the same `tamagui.config.ts` the app uses at runtime, and `components: ['tamagui']` (and your design-system package name if applicable). Include `node_modules/@dimensiondev/rn-ui` in the Babel processing scope if you consume the prebuilt tarball instead of `src/`.
