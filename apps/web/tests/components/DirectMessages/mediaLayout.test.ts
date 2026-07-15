import { describe, expect, test } from 'vitest';

import { resolveDmMediaLayout } from '@/components/DirectMessages/mediaLayout.js';
import type { DirectMessageMedia } from '@/components/DirectMessages/types.js';

function createMedia(overrides: Partial<DirectMessageMedia> = {}): DirectMessageMedia {
    return {
        type: 'image',
        url: 'https://media.example/image.jpg',
        ...overrides,
    };
}

describe('resolveDmMediaLayout', () => {
    test('reserves a landscape media box from its dimensions', () => {
        expect(resolveDmMediaLayout(createMedia({ width: 1920, height: 1080 }))).toEqual({
            aspectRatio: 16 / 9,
            width: 420,
        });
    });

    test('keeps a portrait media box within the maximum height', () => {
        expect(resolveDmMediaLayout(createMedia({ width: 1080, height: 1920 }))).toEqual({
            aspectRatio: 9 / 16,
            width: 236.25,
        });
    });

    test('uses the API aspect ratio when dimensions are unavailable', () => {
        expect(resolveDmMediaLayout(createMedia({ aspectRatio: 1 }))).toEqual({
            aspectRatio: 1,
            width: 280,
        });
    });

    test('uses a stable fallback box when the API has no media metadata', () => {
        expect(resolveDmMediaLayout(createMedia())).toEqual({
            aspectRatio: 4 / 3,
            width: 280,
        });
    });
});
