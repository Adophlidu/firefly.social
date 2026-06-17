import urlcat from 'urlcat';

/**
 * Wrap a raw stream URL (e.g. an insecure IP-hosted CCTV `.m3u8`) so it is
 * served same-origin through our `/api/stream` proxy. This avoids mixed-content
 * blocking on HTTPS pages and cross-origin CORS failures in the HLS player.
 *
 * Browser → /api/stream?url=<raw> → server → upstream source.
 */
export function resolveStreamProxyUrl(rawUrl: string): string {
    return urlcat('/api/stream', { url: rawUrl });
}
