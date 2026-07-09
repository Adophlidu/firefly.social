import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getShortLink, resolveShortLinkKey } from '@/helpers/shortLink.js';
import { shortLinkRedisReader } from '@/libs/ShortLinkRedis.js';

vi.mock('@/libs/ShortLinkRedis.js', () => ({
    shortLinkRedisReader: { get: vi.fn() },
}));

const get = vi.mocked(shortLinkRedisReader.get);

beforeEach(() => {
    get.mockReset();
});

describe('resolveShortLinkKey', () => {
    it('prefixes with the versioned KeyType', () => {
        expect(resolveShortLinkKey('pXjGDMi4Tn')).toBe('/v1/shortLink:pXjGDMi4Tn');
    });
});

describe('getShortLink', () => {
    it('returns the record for a well-formed hash', async () => {
        const record = { url: 'https://firefly.social/post/lens/123', createdAt: 1720000000000 };
        get.mockResolvedValueOnce(record);

        await expect(getShortLink('pXjGDMi4Tn')).resolves.toEqual(record);
        expect(get).toHaveBeenCalledWith('/v1/shortLink:pXjGDMi4Tn');
    });

    it('returns null for an unknown hash', async () => {
        get.mockResolvedValueOnce(null);
        await expect(getShortLink('zzzzzzzzzz')).resolves.toBeNull();
    });

    it('short-circuits malformed hashes without touching Redis', async () => {
        for (const hash of ['', 'short', 'way-too-long-hash', 'bad!chars!', 'abcdefghijk', 'abcdefghi']) {
            await expect(getShortLink(hash)).resolves.toBeNull();
        }

        expect(get).not.toHaveBeenCalled();
    });
});
