import { describe, expect, it } from 'vitest';

import { isStaleStreamEndPlaylist, isStaleStreamEndSegmentUrl } from '@/helpers/prediction/isStaleStreamEndPlaylist.js';

const STALE_PLAYLIST = `#EXTM3U
#EXT-X-VERSION:6
#EXT-X-TARGETDURATION:4
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:4.000000,
http://82.156.243.185:36888/av3a/end0.ts
#EXTINF:4.000000,
http://82.156.243.185:36888/av3a/end3.ts
#EXT-X-ENDLIST`;

const LIVE_PLAYLIST = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-MEDIA-SEQUENCE:1756955161
#EXTINF:5.960,
http://hlslive-cdn.example.com/token/2024078403-1756955161.ts`;

describe('isStaleStreamEndPlaylist', () => {
    it('detects the stream relay end fallback playlist', () => {
        expect(isStaleStreamEndPlaylist(STALE_PLAYLIST)).toBe(true);
    });

    it('ignores live CDN playlists', () => {
        expect(isStaleStreamEndPlaylist(LIVE_PLAYLIST)).toBe(false);
    });
});

describe('isStaleStreamEndSegmentUrl', () => {
    it('matches proxied end segment URLs', () => {
        expect(isStaleStreamEndSegmentUrl('/api/stream?url=http%3A%2F%2F82.156.243.185%3A36888%2Fav3a%2Fend3.ts')).toBe(
            true,
        );
    });
});
