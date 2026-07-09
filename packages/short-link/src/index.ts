/**
 * Deterministic short links: hash = f(canonical identity), computable on both
 * client and server. The canonical serialization and the base62 encoding are
 * forever-contracts — once a client ships, they can never change. Golden test
 * vectors live in apps/web/tests/short-link.test.ts.
 *
 * Uses only Web globals (crypto.subtle, TextEncoder) — no node:crypto, no
 * dependencies — so it runs in browsers, Node >= 18, and the edge runtime.
 */

export type ShortLinkKind = 'post' | 'profile';

export const SHORT_LINK_SOURCES = ['farcaster', 'lens', 'twitter', 'bsky'] as const;
export type ShortLinkSource = (typeof SHORT_LINK_SOURCES)[number];

export interface ShortLinkIdentity {
    kind: ShortLinkKind;
    source: ShortLinkSource;
    /** Verbatim path segment from the link — platform-specific, not validated beyond length. */
    id: string;
    /** Sharer id from the `sid` query param: pure digits, no leading zero. */
    sid?: string;
}

export const SHORT_LINK_SITE_URL = 'https://firefly.social';
export const SHORT_LINK_HASH_LENGTH = 10;
export const SHORT_LINK_HASH_PATTERN = /^[0-9A-Za-z]{10}$/;

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// Ids vary per platform, so they are taken verbatim (still percent-encoded)
// from the path segment with only a length guard.
const MAX_ID_LENGTH = 256;

// Sharer sid is a numeric ff uid: pure digits, starts with 1-9.
const SID_PATTERN = /^[1-9][0-9]*$/;
const MAX_SID_LENGTH = 20;

// Unlike parseUrl in @dimensiondev/utils (not importable here — Layer-1 sibling),
// this never auto-fixes a missing protocol: protocol-less strings must reject.
function parseUrl(url: string): URL | null {
    try {
        return new URL(url);
    } catch {
        return null;
    }
}

function isShortLinkKind(value: string): value is ShortLinkKind {
    return value === 'post' || value === 'profile';
}

function isShortLinkSource(value: string): value is ShortLinkSource {
    return (SHORT_LINK_SOURCES as readonly string[]).includes(value);
}

/**
 * Accepts production-host post and profile links only:
 * `https://firefly.social/{post|profile}/{source}/{id}` with an optional
 * `?sid=` query param. Every other query param is ignored; anything else
 * about the URL (host, protocol, locale prefix, trailing slash, malformed
 * sid) rejects the link with `null`.
 */
export function parseLink(url: string): ShortLinkIdentity | null {
    const parsed = parseUrl(url);
    if (!parsed || parsed.origin !== SHORT_LINK_SITE_URL) return null;

    // Exactly /{kind}/{source}/{id}: split the raw pathname and pick by index.
    const segments = parsed.pathname.split('/');
    if (segments.length !== 4 || segments[0] !== '') return null;

    const [, kind, source, id] = segments;
    if (!isShortLinkKind(kind) || !isShortLinkSource(source)) return null;
    if (!id || id.length > MAX_ID_LENGTH) return null;

    const sid = parsed.searchParams.get('sid')?.trim();
    if (!sid) return { kind, source, id };

    if (sid.length > MAX_SID_LENGTH || !SID_PATTERN.test(sid)) return null;
    return { kind, source, id, sid };
}

/**
 * Fixed 4-field form, id last: `post:lens:<sid>:<id>` with an empty sid slot
 * when absent (`post:lens::<id>`). kind/source/sid all have closed charsets,
 * so the string stays unambiguous even though the id is unconstrained.
 * This is the exact string that gets hashed.
 */
export function canonicalize(identity: ShortLinkIdentity): string {
    return `${identity.kind}:${identity.source}:${identity.sid ?? ''}:${identity.id}`;
}

/**
 * sha256(canonical) -> full 32-byte digest as one big-endian BigInt -> 10
 * least-significant base62 digits. Repeated division instead of per-byte
 * modulo keeps the encoding unbiased and byte-identical everywhere.
 */
export async function computeHash(identity: ShortLinkIdentity): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalize(identity)));

    let value = 0n;
    for (const byte of new Uint8Array(digest)) {
        value = (value << 8n) | BigInt(byte);
    }

    let hash = '';
    for (let i = 0; i < SHORT_LINK_HASH_LENGTH; i += 1) {
        hash += ALPHABET[Number(value % 62n)];
        value /= 62n;
    }
    return hash;
}

/** Rebuilds the canonical destination URL (including `?sid=`) from the identity. */
export function buildDestinationUrl(identity: ShortLinkIdentity): string {
    const url = `${SHORT_LINK_SITE_URL}/${identity.kind}/${identity.source}/${identity.id}`;
    return identity.sid ? `${url}?sid=${identity.sid}` : url;
}

export function formatShortLink(hash: string): string {
    return `${SHORT_LINK_SITE_URL}/i/${hash}`;
}
