import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    createPerpsFavorite,
    getPerpsFavorites,
    removePerpsFavorite,
} from '@/providers/firefly/perps/perpsFavorites.js';

const { fetchWithSession } = vi.hoisted(() => ({ fetchWithSession: vi.fn() }));

vi.mock('@/providers/firefly/SessionHolder.js', () => ({
    fireflySessionHolder: { fetchWithSession },
}));
vi.mock('@/settings/index.js', () => ({
    settings: { FIREFLY_ROOT_URL: 'https://firefly.example' },
}));

describe('perpsFavorites', () => {
    beforeEach(() => {
        fetchWithSession.mockReset();
    });

    it('loads the authenticated favorites list', async () => {
        fetchWithSession.mockResolvedValue({ code: 0, data: { list: [{ name: 'ETH' }], cursor: null } });

        await expect(getPerpsFavorites(50)).resolves.toEqual([{ name: 'ETH' }]);
        const [requestUrl] = fetchWithSession.mock.calls[0];
        const url = new URL(requestUrl);
        expect(url.pathname).toBe('/v1/perps/favorites/find');
        expect(url.searchParams.get('limit')).toBe('50');
        expect(url.searchParams.get('cursor')).toBe('0');
    });

    it.each([
        ['creates', createPerpsFavorite, '/v1/perps/favorites/create'],
        ['removes', removePerpsFavorite, '/v1/perps/favorites/remove'],
    ] as const)('%s a favorite with its raw market name', async (_label, mutate, pathname) => {
        fetchWithSession.mockResolvedValue({ code: 0 });

        await mutate('xyz:SNDK');

        expect(fetchWithSession).toHaveBeenCalledWith(`https://firefly.example${pathname}`, {
            method: 'POST',
            body: JSON.stringify({ name: 'xyz:SNDK' }),
        });
    });
});
