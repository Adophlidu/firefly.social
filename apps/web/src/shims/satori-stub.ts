/** satori is only used by OG/red-packet image services (not in SSR render paths). */
export default function satoriStub(): never {
    throw new Error('satori is not available in the SSR bundle (use workers/og for image generation)');
}
