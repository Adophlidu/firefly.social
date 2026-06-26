import { fetchImageAsPNG } from '@/helpers/fetchImageAsPNG.js';

// Route remote images through the same-origin proxy so the canvas isn't tainted by non-CORS hosts
// (Polymarket market icons / team logos). data:/blob:/same-origin sources are loaded directly.
function toCorsSafeUrl(url: string): string {
    return /^https?:\/\//i.test(url) ? `/api/image/proxy?url=${encodeURIComponent(url)}` : url;
}

function blobToDataUri(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error ?? new Error('Failed to read image blob'));
        reader.readAsDataURL(blob);
    });
}

async function loadImageAsDataUri(url: string): Promise<string | null> {
    try {
        return await blobToDataUri(await fetchImageAsPNG(toCorsSafeUrl(url), true));
    } catch {
        return null;
    }
}

// Memoize by URL: avatar hosts (stamp.*) can be slow (~2s), and the same avatar is fetched on menu
// prewarm and again on the actual render — the cache turns the second call into an instant hit.
const dataUriCache = new Map<string, Promise<string | null>>();

/**
 * Loads a remote image into a PNG data URI via `<img crossorigin> → canvas`, NOT `fetch`. The app's
 * CSP `connect-src` is a strict allowlist, so a browser `fetch` of an avatar host (e.g.
 * stamp.firefly.land) is blocked; `img-src` is `*`, so loading through an `<img>` element works for
 * any CORS-enabled source and decodes webp/avif natively. Returns null when the image is unavailable
 * or its server omits CORS headers (the canvas would taint) — the caller renders the fallback initial.
 */
export function fetchImageAsDataUri(url: string): Promise<string | null> {
    const cached = dataUriCache.get(url);
    if (cached) return cached;

    const promise = loadImageAsDataUri(url);
    dataUriCache.set(url, promise);
    // don't cache failures permanently — a later attempt should be able to retry
    void promise.then((result) => {
        if (result === null) dataUriCache.delete(url);
    });
    return promise;
}
