import { describe, expect, test } from 'vitest';

import { toDirectMessageItem } from '@/components/DirectMessages/toDirectMessageItem.js';
import type { ChatMessage } from '@/providers/orb/chat/types.js';

function createMessage(sticker: ChatMessage['sticker'], stickerId = 'sticker-1'): ChatMessage {
    return {
        id: 'message-1',
        channel_id: 'channel-1',
        author_id: '0xauthor',
        content: null,
        parent_message_id: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
        sticker_id: stickerId,
        sticker,
        shared_publication_id: null,
        offer_id: null,
        sale_id: null,
        interactive_action_id: null,
        author_profile: { address: '0xauthor', name: null, handle: null },
        attachments: [],
    };
}

describe('toDirectMessageItem', () => {
    test('maps video attachments with their playback and cover metadata', () => {
        const message = createMessage(null, '');
        message.attachments = [
            {
                __typename: 'MediaVideo',
                id: 'video-1',
                index: 0,
                item: 'https://media.example/clip.mp4',
                cover: 'https://media.example/clip.jpg',
                type: 'video/mp4',
                width: 1920,
                height: 1080,
                aspectRatio: 16 / 9,
            },
        ];

        expect(toDirectMessageItem(message, '0xviewer')).toMatchObject({
            kind: 'media',
            attachments: [
                {
                    type: 'video',
                    url: 'https://media.example/clip.mp4',
                    coverUrl: 'https://media.example/clip.jpg',
                    width: 1920,
                    height: 1080,
                    aspectRatio: 16 / 9,
                },
            ],
        });
    });

    test('maps a sticker message and keeps its metadata URL as a fallback', () => {
        const item = toDirectMessageItem(
            createMessage({
                id: 'sticker-1',
                url: 'https://cdn.example/sticker.webp',
                metadata: { url: 'https://origin.example/sticker.webp' },
            }),
            '0xviewer',
        );

        expect(item).toMatchObject({
            kind: 'sticker',
            url: 'https://cdn.example/sticker.webp',
            fallbackUrl: 'https://origin.example/sticker.webp',
            isSelf: false,
        });
    });

    test('uses the metadata URL when the sticker has no top-level URL', () => {
        const item = toDirectMessageItem(
            createMessage({ id: 'sticker-1', metadata: { url: 'https://origin.example/sticker.webp' } }),
            '0xviewer',
        );

        expect(item).toMatchObject({ kind: 'sticker', url: 'https://origin.example/sticker.webp' });
    });

    test('keeps the unsupported fallback when a sticker has no resource URL', () => {
        expect(toDirectMessageItem(createMessage({ id: 'sticker-1' }), '0xviewer')).toMatchObject({ kind: 'unknown' });
    });

    test('maps an interactive action to a tip message', () => {
        const message = createMessage(null, '');
        message.interactive_action_id = 'tip-1';

        expect(toDirectMessageItem(message, '0xviewer')).toMatchObject({
            kind: 'tip',
            interactiveActionId: 'tip-1',
            isSelf: false,
        });
    });

    test('maps a pending local tip before it has an interactive action ID', () => {
        const message = createMessage(null, '');
        message.send_status = 'pending';
        message.pending_tip = {
            targetUserId: '0xtarget',
            amount: 1,
            currency: '0xtoken',
            currencySymbol: 'GHO',
            chainId: 232,
            nextStep: 'create',
        };

        expect(toDirectMessageItem(message, '0xauthor')).toMatchObject({
            kind: 'tip',
            interactiveActionId: undefined,
            pendingTip: message.pending_tip,
            status: 'pending',
            isSelf: true,
        });
    });
});
