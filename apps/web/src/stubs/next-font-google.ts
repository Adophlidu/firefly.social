// Runtime stub for next/font/google used outside Next.js (Vite SSR/client builds
// and Vitest have no Next.js font loader). Mirrors ./next-font-local.ts.
// Only the fonts actually imported by src/fonts/* need named exports here.
function createGoogleFont(_options?: unknown) {
    return {
        className: 'next-font-google-stub',
        variable: '--font-google-stub',
        style: { fontFamily: 'next-font-google-stub' },
    };
}

export const Inter = createGoogleFont;
