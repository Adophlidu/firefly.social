/** CCTV relay fallback when rate-limited: finite `endN.ts` playlist that 404s. */
const STALE_END_PLAYLIST_SEGMENT = /end\d+\.ts/i;

export function isStaleCctvEndPlaylist(playlist: string): boolean {
    if (!/#EXT-X-ENDLIST/i.test(playlist)) return false;
    return STALE_END_PLAYLIST_SEGMENT.test(playlist);
}

export function isStaleCctvEndSegmentUrl(url: string): boolean {
    return STALE_END_PLAYLIST_SEGMENT.test(url);
}
