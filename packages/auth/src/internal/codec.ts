import { parseJson } from '@dimensiondev/utils';

/**
 * Encoding helpers that mirror the Firefly app's session serialization so this
 * package can read and write the exact same on-disk format.
 *
 * - "ascii" payloads:    `btoa(JSON.stringify(x))`
 * - "no-ascii" payloads: base64 of the UTF-8 bytes (handles non-Latin1 chars)
 */

export function encodeAscii(payload: unknown): string {
    return btoa(JSON.stringify(payload));
}

export function decodeAscii<T>(payload: string): T | null {
    try {
        return parseJson<T>(atob(payload)) ?? null;
    } catch {
        return null;
    }
}

export function encodeNoAscii(payload: unknown): string {
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

export function decodeNoAscii<T>(payload: string): T | null {
    try {
        return parseJson<T>(decodeURIComponent(escape(atob(payload)))) ?? null;
    } catch {
        return null;
    }
}
