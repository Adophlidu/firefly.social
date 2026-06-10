import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchImageAsMediaObject } from '@/helpers/fetchImageAsMediaObject.js';

describe('fetchImageAsMediaObject', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('wraps the fetched blob into a local MediaObject', async () => {
        const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(blob, { status: 200 })));

        const media = await fetchImageAsMediaObject('https://example.com/share.png', 'share.png');
        expect(media.file.name).toBe('share.png');
        expect(media.mimeType).toBe('image/png');
        expect(media.id).toBeTruthy();
    });

    it('throws when the image cannot be fetched', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })));

        await expect(fetchImageAsMediaObject('https://example.com/missing.png')).rejects.toThrow();
    });
});
