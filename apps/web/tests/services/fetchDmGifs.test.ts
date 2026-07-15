import { describe, expect, test } from 'vitest';

import { formatDmGif } from '@/services/fetchDmGifs.js';

describe('formatDmGif', () => {
    test('uses the downsized URL and fixed-width preview', () => {
        expect(
            formatDmGif({
                id: 'gif-1',
                images: {
                    downsized: { url: 'https://media.example/full.gif' },
                    fixed_width: {
                        webp: 'https://media.example/preview.webp',
                        width: '240',
                        height: '160',
                    },
                },
            }),
        ).toEqual({
            id: 'gif-1',
            url: 'https://media.example/full.gif',
            preview: 'https://media.example/preview.webp',
            width: 240,
            height: 160,
        });
    });

    test('ignores results without usable media', () => {
        expect(formatDmGif({ id: 'gif-2', images: {} })).toBeNull();
    });
});
