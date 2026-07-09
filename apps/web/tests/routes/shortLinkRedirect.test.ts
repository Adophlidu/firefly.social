import { NextRequest } from 'next/server.js';
import { describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/i/[hash]/route.js';
import { getShortLink } from '@/helpers/shortLink.js';

vi.mock('@/helpers/shortLink.js', () => ({
    getShortLink: vi.fn(),
}));

const getShortLinkMock = vi.mocked(getShortLink);

describe('GET /i/[hash]', () => {
    it('redirects to the destination with a permanent (301) status', async () => {
        getShortLinkMock.mockResolvedValueOnce({
            url: 'https://firefly.social/post/lens/123',
            createdAt: Date.now(),
        });

        const request = new NextRequest('https://firefly.social/i/pXjGDMi4Tn');
        const response = await GET(request, { params: Promise.resolve({ hash: 'pXjGDMi4Tn' }) });

        // 301, not 307: short links are deterministic/permanent, and 301 is followed
        // by the widest range of link-unfurling bots (see the comment in route.ts).
        expect(response.status).toBe(301);
        expect(response.headers.get('location')).toBe('https://firefly.social/post/lens/123');
    });

    it('returns a bare 404 with no body for an unknown hash', async () => {
        getShortLinkMock.mockResolvedValueOnce(null);

        const request = new NextRequest('https://firefly.social/i/zzzzzzzzzz');
        const response = await GET(request, { params: Promise.resolve({ hash: 'zzzzzzzzzz' }) });

        expect(response.status).toBe(404);
        expect(await response.text()).toBe('');
    });
});
