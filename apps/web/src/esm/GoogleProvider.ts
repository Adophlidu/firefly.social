import NextGoogleProvider from 'next-auth/providers/google';

// CJS default-export interop differs between bundlers: esbuild (worker bundle)
// yields the module namespace, Vite's dev SSR (native Node) yields the
// __esModule default. Take whichever holds the real export.
const resolved = (NextGoogleProvider as unknown as { default?: unknown }).default ?? NextGoogleProvider;

export const GoogleProvider = resolved as typeof NextGoogleProvider.default;
