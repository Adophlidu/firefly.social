import { beforeEach, describe, expect, it, vi } from 'vitest';

import { registerShortLink } from '@/actions/registerShortLink.js';
import { shortLinkRedisWriter } from '@/libs/ShortLinkRedis.js';

vi.mock('@/libs/ShortLinkRedis.js', () => ({
    shortLinkRedisWriter: { set: vi.fn() },
}));

const set = vi.mocked(shortLinkRedisWriter.set);

beforeEach(() => {
    set.mockReset();
    set.mockResolvedValue('OK');
});

describe('registerShortLink', () => {
    it('returns null for links short-link does not support', async () => {
        await expect(registerShortLink('https://firefly.social/explore')).resolves.toBeNull();
        await expect(registerShortLink('https://evil.example.com/post/lens/123')).resolves.toBeNull();
        expect(set).not.toHaveBeenCalled();
    });

    it('registers a supported link and returns its short URL', async () => {
        const shortUrl = await registerShortLink('https://firefly.social/post/lens/123?sid=456');

        expect(shortUrl).toMatch(/^https:\/\/firefly\.social\/i\/[0-9A-Za-z]{10}$/);
        expect(set).toHaveBeenCalledTimes(1);

        const [key, record, options] = set.mock.calls[0];
        expect(key).toBe(`/v1/shortLink:${shortUrl!.split('/').pop()}`);
        expect(record).toMatchObject({ url: 'https://firefly.social/post/lens/123?sid=456' });
        expect(options).toEqual({ nx: true });
    });

    it('is deterministic: the same link always registers under the same hash', async () => {
        const first = await registerShortLink('https://firefly.social/post/lens/123?sid=456');
        const second = await registerShortLink('https://firefly.social/post/lens/123?sid=456');

        expect(first).toBe(second);
    });
});
