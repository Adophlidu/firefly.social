import { describe, expect, test } from 'vitest';

import {
    createDmAttachment,
    createDmGifDraft,
    createDmImageAttachment,
    toDmVideoCompatibilityAttachment,
} from '@/providers/orb/chat/media.js';

describe('createDmImageAttachment', () => {
    test('creates an Orb MediaImage from a hosted GIF', () => {
        expect(
            createDmImageAttachment(
                {
                    id: 'gif-1',
                    url: 'https://media.example/gif.gif',
                    type: 'image/gif',
                    width: 480,
                    height: 320,
                },
                2,
            ),
        ).toEqual({
            __typename: 'MediaImage',
            id: 'gif-1',
            index: 2,
            item: 'https://media.example/gif.gif',
            raw: 'https://media.example/gif.gif',
            type: 'image/gif',
            width: 480,
            height: 320,
            aspectRatio: 1.5,
        });
    });

    test('uses the uploaded URL for a local image', () => {
        const attachment = createDmImageAttachment(
            {
                id: 'image-1',
                url: 'blob:preview',
                type: 'image/png',
            },
            0,
            'https://s3.example/image.png',
        );

        expect(attachment.item).toBe('https://s3.example/image.png');
        expect(attachment.raw).toBe('https://s3.example/image.png');
    });
});

describe('createDmAttachment', () => {
    test('creates an Orb MediaVideo with its uploaded video and cover URLs', () => {
        expect(
            createDmAttachment(
                {
                    id: 'video-1',
                    url: 'blob:preview',
                    type: 'video/mp4',
                    file: new File(['video'], 'clip.mp4', { type: 'video/mp4' }),
                    width: 1920.4,
                    height: 1079.6,
                    duration: 12.6,
                },
                1,
                'https://s3.example/clip.mp4',
                'https://s3.example/clip-cover.jpg',
            ),
        ).toEqual({
            __typename: 'MediaVideo',
            id: 'video-1',
            index: 1,
            item: 'https://s3.example/clip.mp4',
            cover: 'https://s3.example/clip-cover.jpg',
            duration: 13,
            title: 'clip.mp4',
            type: 'video/mp4',
            width: 1920,
            height: 1080,
            aspectRatio: 16 / 9,
        });
    });

    test('strips optional video metadata for the production compatibility retry', () => {
        const attachment = createDmAttachment(
            {
                id: 'video-1',
                url: 'https://s3.example/clip.mp4',
                type: 'video/mp4',
                width: 1920,
                height: 1080,
                duration: 12,
            },
            0,
            'https://s3.example/clip.mp4',
            'https://s3.example/clip-cover.jpg',
        );

        expect(toDmVideoCompatibilityAttachment(attachment)).toEqual({
            __typename: 'MediaVideo',
            id: 'video-1',
            index: 0,
            item: 'https://s3.example/clip.mp4',
            cover: 'https://s3.example/clip-cover.jpg',
            type: 'video/mp4',
        });
    });
});

describe('createDmGifDraft', () => {
    test('uses a UUID and the App-compatible GIF fields', () => {
        const draft = createDmGifDraft('https://media.example/gif.gif', 480, 320);

        expect(draft).toEqual({
            id: expect.stringMatching(/^[0-9a-f-]{36}$/u),
            url: 'https://media.example/gif.gif',
            type: 'image/gif',
            width: 480,
            height: 320,
        });
    });
});
