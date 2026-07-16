/**
 * Short-link identity parsing: recognizes which Firefly URLs are
 * share-linkable and rebuilds their canonical destination URL. The short code
 * itself is assigned by the backend (`POST /v1/shortlinks`) — this package
 * only decides what's eligible to register and normalizes the destination
 * beforehand; it does not compute or format a code itself.
 *
 * Uses only Web globals (URL/URLSearchParams) — no dependencies — so it runs
 * in browsers, Node, and the edge runtime.
 */

export type ShortLinkKind =
    | 'post'
    | 'profile'
    | 'article'
    | 'swap'
    | 'prediction'
    | 'predictionProfile'
    | 'token'
    | 'club';

// 'twitter' and 'x' both route live: resolveSourceInUrl() emits 'x' for
// Source.Twitter (the post/profile page accepts either segment), so both
// must be accepted here or every X share link fails to parse.
export const SHORT_LINK_SOURCES = ['farcaster', 'lens', 'twitter', 'x', 'bsky'] as const;
export type ShortLinkSource = (typeof SHORT_LINK_SOURCES)[number];

// Clubs only exist on Lens/Farcaster/Bluesky today — narrower than SHORT_LINK_SOURCES (no Twitter).
export const SHORT_LINK_CLUB_SOURCES = ['farcaster', 'lens', 'bsky'] as const;
export type ShortLinkClubSource = (typeof SHORT_LINK_CLUB_SOURCES)[number];

export const SHORT_LINK_PREDICTION_PLATFORMS = ['polymarket', 'opinion'] as const;
export type ShortLinkPredictionPlatform = (typeof SHORT_LINK_PREDICTION_PLATFORMS)[number];

export interface ShortLinkIdentity {
    kind: ShortLinkKind;
    /** Empty string for kinds with no source segment in their route (article). */
    source: string;
    /** Verbatim path segment from the link — platform-specific, not validated beyond length. */
    id: string;
    /** Sharer id from the `sid` query param: pure digits, no leading zero. */
    sid?: string;
    /** prediction only: the event is a multi-outcome market (`?type=multi`) — changes the destination page's data fetch, so it must survive the round trip. */
    multi?: boolean;
    /** swap only: a Tips link's sender/receiver view (`?view=`) — changes which side of the tip the destination page renders. Absent for a plain Swap tx link. */
    view?: 'sender' | 'receiver';
    /** token only, dex sub-shape: the chain id (`/token/dex/:chainId/:address`). Absent for the cex sub-shape (`/token/cex/:id`). */
    chainId?: string;
}

export const SHORT_LINK_SITE_HOST = 'firefly.social';
export const SHORT_LINK_SITE_URL = `https://${SHORT_LINK_SITE_HOST}`;

// Explicit allowlist, not a `*.firefly.social` wildcard: an open wildcard would
// accept any subdomain, including ones subject to future subdomain takeover.
// Add new deployment subdomains here deliberately as they're provisioned.
const SHORT_LINK_ALLOWED_HOSTS = new Set([
    SHORT_LINK_SITE_HOST,
    `canary.${SHORT_LINK_SITE_HOST}`,
    `staging.${SHORT_LINK_SITE_HOST}`,
    `alpha.${SHORT_LINK_SITE_HOST}`,
    `beta.${SHORT_LINK_SITE_HOST}`,
]);

// Ids vary per platform, so they are taken verbatim (still percent-encoded)
// from the path segment with only a length guard.
const MAX_ID_LENGTH = 256;

// Shared by sharer sid (a numeric ff uid) and swap chain id: pure digits, no leading zero.
const POSITIVE_INT_PATTERN = /^[1-9][0-9]*$/;
const MAX_POSITIVE_INT_LENGTH = 20;

const SOCIAL_SOURCES = new Set<string>(SHORT_LINK_SOURCES);
const CLUB_SOURCES = new Set<string>(SHORT_LINK_CLUB_SOURCES);
const PREDICTION_PLATFORMS = new Set<string>(SHORT_LINK_PREDICTION_PLATFORMS);

// Unlike parseUrl in @dimensiondev/utils (not importable here — Layer-1 sibling),
// this never auto-fixes a missing protocol: protocol-less strings must reject.
function parseUrl(url: string): URL | null {
    try {
        return new URL(url);
    } catch {
        return null;
    }
}

function isShortLinkHost(hostname: string): boolean {
    return SHORT_LINK_ALLOWED_HOSTS.has(hostname);
}

function isValidId(id: string): boolean {
    return !!id && id.length <= MAX_ID_LENGTH;
}

/**
 * Matches a pathname against every supported kind's route shape:
 * - `/post/:source/:id`, `/profile/:source/:id`, `/club/:source/:id` — source
 *   is a social platform (club is narrower: no Twitter)
 * - `/article/:id` — no source segment
 * - `/tx/:chainId/:hash` — kind `swap`, source is the numeric chain id
 * - `/:platform/event/:eventId` — kind `prediction`, source is the platform,
 *   no literal kind segment (the platform itself sits where a kind name
 *   normally would)
 * - `/:platform/profile/:address` — kind `predictionProfile`, same shape as
 *   `prediction` but with the literal `profile` keyword instead of `event`
 * - `/token/cex/:id` — kind `token`, source `cex`
 * - `/token/dex/:chainId/:address` — kind `token`, source `dex`, chain id
 *   carried separately since `id` already holds the address
 *
 * Each shape is structurally distinct (segment count and/or a literal
 * keyword), so there's no ambiguity between kinds.
 */
function matchPathname(pathname: string): Omit<ShortLinkIdentity, 'sid' | 'multi' | 'view'> | null {
    const segments = pathname.split('/');
    if (segments[0] !== '') return null;

    if (segments.length === 3) {
        const [, first, id] = segments;
        if (first === 'article' && isValidId(id)) return { kind: 'article', source: '', id };
        return null;
    }

    if (segments.length === 5) {
        const [, first, second, third, fourth] = segments;
        if (
            first === 'token' &&
            second === 'dex' &&
            POSITIVE_INT_PATTERN.test(third) &&
            third.length <= MAX_POSITIVE_INT_LENGTH &&
            isValidId(fourth)
        ) {
            return { kind: 'token', source: 'dex', id: fourth, chainId: third };
        }
        return null;
    }

    if (segments.length !== 4) return null;
    const [, first, second, third] = segments;

    if ((first === 'post' || first === 'profile') && SOCIAL_SOURCES.has(second) && isValidId(third)) {
        return { kind: first, source: second, id: third };
    }

    if (first === 'club' && CLUB_SOURCES.has(second) && isValidId(third)) {
        return { kind: 'club', source: second, id: third };
    }

    if (first === 'token' && second === 'cex' && isValidId(third)) {
        return { kind: 'token', source: 'cex', id: third };
    }

    if (
        first === 'tx' &&
        POSITIVE_INT_PATTERN.test(second) &&
        second.length <= MAX_POSITIVE_INT_LENGTH &&
        isValidId(third)
    ) {
        return { kind: 'swap', source: second, id: third };
    }

    if (second === 'event' && PREDICTION_PLATFORMS.has(first) && isValidId(third)) {
        return { kind: 'prediction', source: first, id: third };
    }

    if (second === 'profile' && PREDICTION_PLATFORMS.has(first) && isValidId(third)) {
        return { kind: 'predictionProfile', source: first, id: third };
    }

    return null;
}

/**
 * Accepts post, profile, article, swap, prediction, predictionProfile, token,
 * and club links on an allowlisted host only — the apex domain or one of a
 * fixed set of deployment subdomains (see SHORT_LINK_ALLOWED_HOSTS), never an
 * open `*.firefly.social` wildcard. See {@link matchPathname} for the
 * accepted route shapes. Recognizes an optional `?sid=` query param on every
 * kind, plus `?type=multi` on prediction links and `?view=sender|receiver` on
 * swap links (the only other query params that change the destination page's
 * behavior — the latter only applies to a Tips tx link, sharing the same
 * `/tx/:chainId/:hash` shape as a plain Swap link). Every other query param
 * is ignored; anything else about the URL (host, protocol, non-default port,
 * locale prefix, trailing slash, malformed sid) rejects the link with
 * `null`.
 */
export function parseLink(url: string): ShortLinkIdentity | null {
    const parsed = parseUrl(url);
    // https only, default port, an allowlisted host.
    if (parsed?.protocol !== 'https:' || parsed.port || !isShortLinkHost(parsed.hostname)) {
        return null;
    }

    const matched = matchPathname(parsed.pathname);
    if (!matched) return null;

    const identity: ShortLinkIdentity = { ...matched };

    if (matched.kind === 'prediction' && parsed.searchParams.get('type') === 'multi') {
        identity.multi = true;
    }

    if (matched.kind === 'swap') {
        const view = parsed.searchParams.get('view');
        if (view === 'sender' || view === 'receiver') identity.view = view;
    }

    const sid = parsed.searchParams.get('sid')?.trim();
    if (sid) {
        if (sid.length > MAX_POSITIVE_INT_LENGTH || !POSITIVE_INT_PATTERN.test(sid)) return null;
        identity.sid = sid;
    }

    return identity;
}

function buildPathname(identity: ShortLinkIdentity): string {
    switch (identity.kind) {
        case 'post':
        case 'profile':
        case 'club':
            return `/${identity.kind}/${identity.source}/${identity.id}`;
        case 'article':
            return `/article/${identity.id}`;
        case 'swap':
            return `/tx/${identity.source}/${identity.id}`;
        case 'prediction':
            return `/${identity.source}/event/${identity.id}`;
        case 'predictionProfile':
            return `/${identity.source}/profile/${identity.id}`;
        case 'token':
            return identity.source === 'dex'
                ? `/token/dex/${identity.chainId}/${identity.id}`
                : `/token/cex/${identity.id}`;
    }
}

/**
 * Rebuilds the canonical destination URL from the identity, including
 * `?sid=` and, for prediction, `?type=multi`, and, for swap, `?view=` (Tips
 * links only).
 */
export function buildDestinationUrl(identity: ShortLinkIdentity): string {
    const params = new URLSearchParams();
    if (identity.kind === 'prediction' && identity.multi) params.set('type', 'multi');
    if (identity.kind === 'swap' && identity.view) params.set('view', identity.view);
    if (identity.sid) params.set('sid', identity.sid);

    const query = params.toString();
    return `${SHORT_LINK_SITE_URL}${buildPathname(identity)}${query ? `?${query}` : ''}`;
}
