import { describe, expect, it } from 'vitest';

import { parseEmbedPlayerIframe } from '@/helpers/parseEmbedPlayerIframe.js';

describe('parseEmbedPlayerIframe', () => {
    it('accepts a single allowlisted iframe from the OG worker', () => {
        expect(
            parseEmbedPlayerIframe(
                '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="100%" height="415" allow="accelerometer; encrypted-media" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
            ),
        ).toEqual({
            src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            height: 415,
            allow: 'accelerometer; encrypted-media',
            allowFullScreen: true,
            referrerPolicy: 'strict-origin-when-cross-origin',
            style: undefined,
        });
    });

    it('accepts Spotify embed iframes', () => {
        expect(
            parseEmbedPlayerIframe(
                '<iframe src="https://open.spotify.com/embed/track/abc123" style="max-width: 100%;" width="100%" height="155" allow="encrypted-media"></iframe>',
            ),
        ).toEqual({
            src: 'https://open.spotify.com/embed/track/abc123',
            height: 155,
            allow: 'encrypted-media',
            allowFullScreen: undefined,
            referrerPolicy: undefined,
            style: 'max-width: 100%;',
        });
    });

    it('rejects non-iframe markup', () => {
        expect(parseEmbedPlayerIframe('<div>not an iframe</div>')).toBeNull();
    });

    it('rejects iframe markup with extra HTML', () => {
        expect(
            parseEmbedPlayerIframe(
                '<iframe src="https://www.youtube.com/embed/abc" height="415"></iframe><script>alert(1)</script>',
            ),
        ).toBeNull();
    });

    it('rejects iframes pointing at non-allowlisted hosts', () => {
        expect(parseEmbedPlayerIframe('<iframe src="https://evil.example/embed" height="415"></iframe>')).toBeNull();
    });

    it('rejects non-https iframe sources', () => {
        expect(
            parseEmbedPlayerIframe('<iframe src="http://www.youtube.com/embed/abc" height="415"></iframe>'),
        ).toBeNull();
    });
});
