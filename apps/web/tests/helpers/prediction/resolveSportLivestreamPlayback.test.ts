import { describe, expect, it } from 'vitest';

import { resolveSportLivestreamPlayback } from '@/helpers/prediction/resolveSportLivestreamPlayback.js';

describe('resolveSportLivestreamPlayback', () => {
    it('embeds Twitch livestream URLs', () => {
        expect(
            resolveSportLivestreamPlayback(
                {
                    livestreamUrl: 'https://www.twitch.tv/fireflysports',
                },
                'firefly.social',
            ),
        ).toEqual({
            type: 'embed',
            embedUrl: 'https://player.twitch.tv/?channel=fireflysports&parent=firefly.social&autoplay=false&muted=true',
            sourceUrl: 'https://www.twitch.tv/fireflysports',
        });
    });

    it('uses Twitch player URLs for embeds and replaces parent', () => {
        expect(
            resolveSportLivestreamPlayback(
                {
                    livestreamUrl: 'https://www.twitch.tv/fireflysports',
                    playerUrl: 'https://player.twitch.tv/?channel=fireflysports&parent=old.example',
                },
                'mask.social',
            ),
        ).toEqual({
            type: 'embed',
            embedUrl: 'https://player.twitch.tv/?channel=fireflysports&parent=mask.social&muted=true',
            sourceUrl: 'https://www.twitch.tv/fireflysports',
        });
    });

    it('opens non-Twitch URLs externally and keeps the original livestream URL when available', () => {
        expect(
            resolveSportLivestreamPlayback(
                {
                    livestreamUrl: 'https://kick.com/fireflysports',
                    playerUrl: 'https://player.kick.com/fireflysports',
                },
                'firefly.social',
            ),
        ).toEqual({
            type: 'external',
            url: 'https://kick.com/fireflysports',
        });
    });
});
