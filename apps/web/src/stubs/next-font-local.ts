// Runtime stub for next/font/local used in Vitest (jsdom has no Next.js font loader).
// Returns a dummy font object so modules that call localFont() at load time import cleanly.
export default function localFont() {
    return {
        className: 'next-font-local-stub',
        variable: '--font-local-stub',
        style: { fontFamily: 'next-font-local-stub' },
    };
}
