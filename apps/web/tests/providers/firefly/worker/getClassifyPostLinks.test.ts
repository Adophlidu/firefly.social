import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getClassifyPostLinks } from '@/providers/firefly/worker/getClassifyPostLinks.js';

const { fetchJson } = vi.hoisted(() => ({
    fetchJson: vi.fn(),
}));

vi.mock('@/constants/static.js', () => ({
    FIREFLY_WORKER_HOST: 'https://worker.firefly.test',
}));

vi.mock('@/helpers/fetchJson.js', () => ({
    fetchJson,
}));

describe('getClassifyPostLinks', () => {
    beforeEach(() => {
        fetchJson.mockReset();
    });

    it('normalizes firefly sharer links before classifying and maps the result back to the original url', async () => {
        const originalUrl = 'https://firefly.social/post/x/2044966982446129352?sid=2974712182';
        const normalizedUrl = 'https://firefly.social/post/x/2044966982446129352';
        const quote = { postId: '2044966982446129352' } as any;

        fetchJson.mockResolvedValue({
            success: true,
            data: [{ url: normalizedUrl, result: { quote } }],
        });

        const result = await getClassifyPostLinks([originalUrl]);

        expect(fetchJson).toHaveBeenCalledWith(expect.stringContaining(encodeURIComponent(normalizedUrl)));
        expect(fetchJson).not.toHaveBeenCalledWith(expect.stringContaining(encodeURIComponent(originalUrl)));
        expect(result).toEqual([{ url: originalUrl, result: { quote } }]);
    });
});
