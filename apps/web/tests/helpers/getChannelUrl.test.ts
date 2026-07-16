import { Source } from '@dimensiondev/enums';
import { describe, expect, it } from 'vitest';

import { getChannelUrl, getClubShareUrl } from '@/helpers/getChannelUrl.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

function makeChannel(source: Source, id: string): Channel {
    return { source, id } as unknown as Channel;
}

describe('getChannelUrl', () => {
    it('includes the :type tab suffix for lens/farcaster/bsky', () => {
        expect(getChannelUrl(makeChannel(Source.Farcaster, '123'))).toBe('/club/farcaster/123/posts');
        expect(getChannelUrl(makeChannel(Source.Lens, '123'))).toBe('/club/lens/123/posts');
        expect(getChannelUrl(makeChannel(Source.Bsky, '123'))).toBe('/club/bsky/123/posts');
    });

    it('returns empty for twitter and for a missing id', () => {
        expect(getChannelUrl(makeChannel(Source.Twitter, '123'))).toBe('');
        expect(getChannelUrl(makeChannel(Source.Farcaster, ''))).toBe('');
    });
});

describe('getClubShareUrl', () => {
    it('matches the short-link club kind shape — no :type suffix', () => {
        expect(getClubShareUrl(makeChannel(Source.Farcaster, '123'))).toBe('/club/farcaster/123');
        expect(getClubShareUrl(makeChannel(Source.Lens, '123'))).toBe('/club/lens/123');
        expect(getClubShareUrl(makeChannel(Source.Bsky, '123'))).toBe('/club/bsky/123');
    });

    it('returns empty for twitter and for a missing id', () => {
        expect(getClubShareUrl(makeChannel(Source.Twitter, '123'))).toBe('');
        expect(getClubShareUrl(makeChannel(Source.Farcaster, ''))).toBe('');
    });
});
