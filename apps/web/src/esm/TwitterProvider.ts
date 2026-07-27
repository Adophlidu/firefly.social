import NextAuthTwitter from 'next-auth/providers/twitter';

// CJS default-export interop differs between bundlers: esbuild (worker bundle)
// yields the module namespace, Vite's dev SSR (native Node) yields the
// __esModule default. Take whichever holds the real export.
const resolved = (NextAuthTwitter as unknown as { default?: unknown }).default ?? NextAuthTwitter;

export const TwitterProvider = resolved as typeof NextAuthTwitter.default;
