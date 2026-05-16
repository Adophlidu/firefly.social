/**
 * Encode a Uint8Array to a URL-safe base64 string (no padding).
 * Compatible with Cloudflare Workers runtime.
 */
export function bytesToBase64url(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Encode a UTF-8 string to its byte representation.
 */
export function stringToBytes(str: string): Uint8Array {
    return new TextEncoder().encode(str);
}

/**
 * Decode a URL-safe base64 string to a Uint8Array.
 */
export function base64urlToBytes(b64url: string): Uint8Array {
    const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=');
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}
