import NextAuth from 'next-auth';

// CJS default-export interop differs between bundlers: esbuild (worker bundle)
// yields the module namespace, Vite's dev SSR (native Node) yields the
// __esModule default. Take whichever holds the real export.
const resolved = (NextAuth as unknown as { default?: unknown }).default ?? NextAuth;

export const Auth = resolved as typeof NextAuth.default;
