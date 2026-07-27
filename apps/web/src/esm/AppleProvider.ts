import NextAppleProvider from 'next-auth/providers/apple';

// CJS default-export interop differs between bundlers: esbuild (worker bundle)
// yields the module namespace, Vite's dev SSR (native Node) yields the
// __esModule default. Take whichever holds the real export.
const resolved = (NextAppleProvider as unknown as { default?: unknown }).default ?? NextAppleProvider;

export const AppleProvider = resolved as typeof NextAppleProvider.default;
