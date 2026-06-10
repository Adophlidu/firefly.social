import { afterEach, describe, expect, it, vi } from 'vitest';

import { copyImageToClipboard, supportsImageClipboard } from '@/helpers/copyImageToClipboard.js';

describe('supportsImageClipboard', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('reports unsupported when ClipboardItem is missing', () => {
        vi.stubGlobal('ClipboardItem', undefined);
        expect(supportsImageClipboard()).toBe(false);
    });
});

describe('copyImageToClipboard', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('writes the fetched png to the clipboard', async () => {
        class FakeClipboardItem {
            constructor(public items: Record<string, unknown>) {}
        }
        const write = vi.fn().mockResolvedValue(undefined);
        vi.stubGlobal('ClipboardItem', FakeClipboardItem);
        vi.stubGlobal('navigator', { clipboard: { write } });
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(new Response(new Blob([new Uint8Array([1])], { type: 'image/png' }))),
        );

        await copyImageToClipboard('https://example.com/share.png');
        expect(write).toHaveBeenCalledTimes(1);
    });

    it('throws when unsupported', async () => {
        vi.stubGlobal('ClipboardItem', undefined);
        await expect(copyImageToClipboard('https://example.com/share.png')).rejects.toThrow();
    });
});
