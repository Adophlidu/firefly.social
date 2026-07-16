import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FetchError } from '@/constants/error.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getShortLink } from '@/helpers/shortLink.js';

vi.mock('@/helpers/fetchJson.js', () => ({
    fetchJson: vi.fn(),
}));

const mockedFetchJson = vi.mocked(fetchJson);

beforeEach(() => {
    mockedFetchJson.mockReset();
});

describe('getShortLink', () => {
    it('resolves the destination URL for a well-formed code', async () => {
        mockedFetchJson.mockResolvedValueOnce({ code: 0, data: { url: 'https://firefly.social/post/lens/123' } });

        await expect(getShortLink('AbCdEfGhIjKl')).resolves.toEqual({ url: 'https://firefly.social/post/lens/123' });
        expect(mockedFetchJson).toHaveBeenCalledWith(expect.stringContaining('/v1/shortlinks'));
        expect(mockedFetchJson).toHaveBeenCalledWith(expect.stringContaining('code=AbCdEfGhIjKl'));
    });

    it('returns null for an unknown code (backend 404)', async () => {
        mockedFetchJson.mockRejectedValueOnce(new FetchError('Not Found', 'url', 404, 'Not Found', ''));
        await expect(getShortLink('zzzzzzzzzzzz')).resolves.toBeNull();
    });

    it('re-throws non-404 backend errors', async () => {
        mockedFetchJson.mockRejectedValueOnce(new FetchError('Server Error', 'url', 500, 'Server Error', ''));
        await expect(getShortLink('zzzzzzzzzzzz')).rejects.toThrow();
    });

    it('short-circuits malformed codes without touching the backend', async () => {
        for (const code of ['', 'short', 'waytoolongcodewaytoolong', 'bad!chars!!!', 'abcdefghijk', 'abcdefghi']) {
            await expect(getShortLink(code)).resolves.toBeNull();
        }

        expect(mockedFetchJson).not.toHaveBeenCalled();
    });
});
