import PlyrReact from 'plyr-react';

// CJS default-export interop differs between bundlers: esbuild (worker bundle)
// yields the module namespace, Vite's dev SSR (native Node) yields the
// __esModule default. Take whichever holds the real export.
const resolved = (PlyrReact as unknown as { default?: unknown }).default ?? PlyrReact;

export const Plyr: typeof PlyrReact.default = resolved as typeof PlyrReact.default;
