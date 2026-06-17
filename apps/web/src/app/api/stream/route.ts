import type { NextRequest } from 'next/server.js';

import { isStaleStreamEndPlaylist } from '@/helpers/prediction/isStaleStreamEndPlaylist.js';
import { logger } from '@/libs/Logger.js';
import { getFifaLiveStreams } from '@/providers/firefly/prediction/getFifaLiveStreams.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROXY_PATH = '/api/stream';
const ALLOWLIST_TTL = 5 * 60_000;
const UPSTREAM_TIMEOUT = 8_000;
const STALE_END_PLAYLIST_RETRIES = 3;
const STALE_END_PLAYLIST_RETRY_DELAY_MS = 600;
// Serve the last good playlist when the origin flickers to its stale-end
// fallback, so a transient glitch doesn't 502 the player. Tokens stay valid ~1-2min.
const PLAYLIST_CACHE_TTL = 20_000;
const lastGoodPlaylist = new Map<string, { body: string; expiresAt: number }>();

// Origins we'll proxy, derived from config (not a hard-coded IP) to block SSRF.
let allowedOriginsCache: { origins: Set<string>; expiresAt: number } | null = null;

function isLikelyPlaylist(url: string, contentType: string | null): boolean {
    if (contentType && /mpegurl/i.test(contentType)) return true;
    return /\.m3u8(\?|$)/i.test(url);
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getAllowedOrigins(): Promise<Set<string>> {
    if (allowedOriginsCache && allowedOriginsCache.expiresAt > Date.now()) {
        return allowedOriginsCache.origins;
    }

    const origins = new Set<string>();
    try {
        for (const item of await getFifaLiveStreams()) {
            try {
                origins.add(new URL(item.url).origin);
            } catch {
                // Ignore malformed upstream URLs.
            }
        }
    } catch {
        // Reuse the previous allowlist if the config fetch fails.
        if (allowedOriginsCache) return allowedOriginsCache.origins;
    }

    allowedOriginsCache = { origins, expiresAt: Date.now() + ALLOWLIST_TTL };
    return origins;
}

// Nested playlists keep flowing through us (the relay is http-only → mixed
// content, and we must rewrite their contents). Segments and keys are upgraded
// to direct https so each viewer fetches them from their own IP — spreading load
// and avoiding a single proxy IP being universally blocked by the CDN.
function rewriteUri(uri: string, base: URL): string {
    let absolute: URL;
    try {
        absolute = new URL(uri, base);
    } catch {
        return uri;
    }

    if (/\.m3u8(\?|$)/i.test(absolute.href)) {
        return `${PROXY_PATH}?url=${encodeURIComponent(absolute.toString())}`;
    }

    if (absolute.protocol === 'http:') absolute.protocol = 'https:';
    return absolute.toString();
}

function rewritePlaylist(playlist: string, base: URL): string {
    return playlist
        .split(/\r?\n/)
        .map((line) => {
            const trimmed = line.trim();
            if (!trimmed) return line;
            if (trimmed.startsWith('#')) {
                return line.replace(/URI="([^"]+)"/g, (_match, uri: string) => `URI="${rewriteUri(uri, base)}"`);
            }
            return rewriteUri(trimmed, base);
        })
        .join('\n');
}

export async function GET(request: NextRequest) {
    const target = request.nextUrl.searchParams.get('url');
    if (!target) {
        return new Response('Missing url parameter', { status: 400 });
    }

    let upstreamUrl: URL;
    try {
        upstreamUrl = new URL(target);
    } catch {
        return new Response('Invalid url parameter', { status: 400 });
    }

    if (upstreamUrl.protocol !== 'http:' && upstreamUrl.protocol !== 'https:') {
        return new Response('Unsupported protocol', { status: 400 });
    }

    const allowedOrigins = await getAllowedOrigins();
    if (!allowedOrigins.has(upstreamUrl.origin)) {
        return new Response('Origin not allowed', { status: 403 });
    }

    const range = request.headers.get('range');
    const isPlaylistRequest = isLikelyPlaylist(upstreamUrl.toString(), null);
    let upstreamResponse: Response | undefined;
    let playlistBody: string | undefined;
    let lastStatus: number | undefined;
    let lastUpstreamCt: string | null = null;
    let lastFinalUrl: string | undefined;
    let staleSnippet: string | undefined;

    // Only playlists flow through us now; segments/keys go direct from the client.
    const maxAttempts = isPlaylistRequest ? STALE_END_PLAYLIST_RETRIES : 1;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        try {
            upstreamResponse = await fetch(upstreamUrl, {
                method: 'GET',
                headers: range ? { range } : undefined,
                cache: 'no-store',
                redirect: 'follow',
                signal: AbortSignal.timeout(UPSTREAM_TIMEOUT),
            });
        } catch (error) {
            if (attempt < maxAttempts - 1) {
                await sleep(STALE_END_PLAYLIST_RETRY_DELAY_MS * (attempt + 1));
                continue;
            }
            logger.error('[stream] upstream fetch failed', error, {
                url: upstreamUrl.toString(),
                isPlaylistRequest,
                attempts: attempt + 1,
            });
            return new Response('Upstream fetch failed', { status: 502 });
        }

        lastStatus = upstreamResponse.status;
        lastUpstreamCt = upstreamResponse.headers.get('content-type');
        lastFinalUrl = upstreamResponse.url;

        if (!isPlaylistRequest) break;
        if (!isLikelyPlaylist(upstreamUrl.toString(), lastUpstreamCt)) break;

        const playlist = await upstreamResponse.text();
        if (!isStaleStreamEndPlaylist(playlist)) {
            playlistBody = playlist;
            break;
        }

        staleSnippet = playlist.slice(0, 200);
        if (attempt < STALE_END_PLAYLIST_RETRIES - 1) {
            await sleep(STALE_END_PLAYLIST_RETRY_DELAY_MS * (attempt + 1));
        }
    }

    if (!upstreamResponse) {
        logger.error('[stream] no upstream response', undefined, { url: upstreamUrl.toString() });
        return new Response('Upstream fetch failed', { status: 502 });
    }

    const contentType = upstreamResponse.headers.get('content-type');

    if (isLikelyPlaylist(upstreamUrl.toString(), contentType)) {
        const cacheKey = upstreamUrl.toString();

        if (playlistBody === undefined) {
            // Upstream flickered to its end fallback; serve cache, only 502 if it's stale too.
            const cached = lastGoodPlaylist.get(cacheKey);
            if (cached && cached.expiresAt > Date.now()) {
                return new Response(cached.body, {
                    status: 200,
                    headers: { 'content-type': 'application/vnd.apple.mpegurl', 'cache-control': 'no-store' },
                });
            }
            logger.warn('[stream] stale end playlist, no fresh cache', {
                url: cacheKey,
                finalUrl: lastFinalUrl,
                status: lastStatus,
                contentType: lastUpstreamCt,
                attempts: maxAttempts,
                snippet: staleSnippet,
            });
            return new Response('Upstream served stale end playlist', { status: 502 });
        }

        const rewritten = rewritePlaylist(playlistBody, upstreamUrl);
        lastGoodPlaylist.set(cacheKey, { body: rewritten, expiresAt: Date.now() + PLAYLIST_CACHE_TTL });
        return new Response(rewritten, {
            status: upstreamResponse.status,
            headers: {
                'content-type': 'application/vnd.apple.mpegurl',
                'cache-control': 'no-store',
            },
        });
    }

    // Stream binary media segments straight through; forward range metadata.
    const headers = new Headers();
    headers.set('content-type', contentType ?? 'application/octet-stream');
    headers.set('cache-control', 'public, max-age=300');
    const acceptRanges = upstreamResponse.headers.get('accept-ranges');
    if (acceptRanges) headers.set('accept-ranges', acceptRanges);
    const contentRange = upstreamResponse.headers.get('content-range');
    if (contentRange) headers.set('content-range', contentRange);
    const contentLength = upstreamResponse.headers.get('content-length');
    if (contentLength) headers.set('content-length', contentLength);

    return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        headers,
    });
}
