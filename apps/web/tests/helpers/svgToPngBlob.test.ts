import { afterEach, describe, expect, it, vi } from 'vitest';

import { svgToPngBlob } from '@/helpers/svgToPngBlob.js';

interface SetupOptions {
    toBlobResult?: Blob | null;
    failLoad?: boolean;
}

function setup({ toBlobResult, failLoad }: SetupOptions = {}) {
    const drawImage = vi.fn();
    const context = { drawImage };
    const canvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => context),
        toBlob: vi.fn((cb: (b: Blob | null) => void) =>
            cb(toBlobResult === undefined ? new Blob(['png'], { type: 'image/png' }) : toBlobResult),
        ),
    };
    vi.stubGlobal('document', { createElement: vi.fn(() => canvas) });

    const revoked: string[] = [];
    vi.stubGlobal('URL', {
        createObjectURL: vi.fn(() => 'blob:svg'),
        revokeObjectURL: vi.fn((u: string) => revoked.push(u)),
    });

    class FakeImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_v: string) {
            queueMicrotask(() => (failLoad ? this.onerror?.() : this.onload?.()));
        }
    }

    vi.stubGlobal('Image', FakeImage);

    return { canvas, drawImage, revoked };
}

afterEach(() => vi.unstubAllGlobals());

describe('svgToPngBlob', () => {
    it('rasterizes the SVG to a PNG blob, sizing the canvas by width/height × scale', async () => {
        const { canvas, drawImage } = setup();
        const blob = await svgToPngBlob('<svg/>', 750, 1200, 2);
        expect(blob.type).toBe('image/png');
        expect(canvas.width).toBe(1500);
        expect(canvas.height).toBe(2400);
        expect(drawImage).toHaveBeenCalledOnce();
    });

    it('revokes the temporary object URL even on success', async () => {
        const { revoked } = setup();
        await svgToPngBlob('<svg/>', 10, 10);
        expect(revoked).toContain('blob:svg');
    });

    it('rejects when the browser cannot encode the canvas (toBlob → null)', async () => {
        setup({ toBlobResult: null });
        await expect(svgToPngBlob('<svg/>', 10, 10)).rejects.toThrow(/toBlob/);
    });

    it('rejects (and still revokes) when the SVG fails to load', async () => {
        const { revoked } = setup({ failLoad: true });
        await expect(svgToPngBlob('<svg/>', 10, 10)).rejects.toThrow(/load/i);
        expect(revoked).toContain('blob:svg');
    });
});
