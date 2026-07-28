import type { InfiniteData } from '@tanstack/react-query';
import { describe, expect, test } from 'vitest';

import {
    dmKeys,
    getChannelUnreadCount,
    getChannelUnreadCountAcrossQueries,
    markChannelRead,
    markCountersRead,
    mergeDmChannels,
    mergeDmLastMessages,
    resolveSentDmMessage,
} from '@/hooks/useDirectMessages.js';
import type { ChannelCounters, ChatChannel, ChatMessage, MediaAttachment } from '@/providers/orb/chat/types.js';

function createChannel(id: string, lastMessageAt: string | null, unreadCount = 0): ChatChannel {
    return {
        id,
        name: id,
        channel_type: 'dm',
        status: 'ACTIVE',
        club_id: null,
        channel_image_url: null,
        channel_cover_image_url: null,
        channel_blur_cover_image_url: null,
        created_by_user_id: 'creator',
        last_message_at: lastMessageAt,
        channel_membership: {
            id: `membership-${id}`,
            channel_id: id,
            user_id: 'viewer',
            role: 'MEMBER',
            status: 'ACTIVE',
            is_pinned: false,
            is_muted: false,
            is_hidden: false,
            is_marked_as_spam: false,
            chat_request_type: null,
            unread_count: unreadCount,
            last_read_message_id: null,
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
        },
        other_member_profile: null,
        total_members: 2,
    };
}

function createMessage(id: string, channelId: string, createdAt: string): ChatMessage {
    return {
        id,
        channel_id: channelId,
        author_id: 'author',
        content: id,
        parent_message_id: null,
        created_at: createdAt,
        updated_at: createdAt,
        sticker_id: null,
        shared_publication_id: null,
        offer_id: null,
        sale_id: null,
        interactive_action_id: null,
        author_profile: { address: 'author', name: null, handle: null },
        attachments: [],
    };
}

describe('mergeDmChannels', () => {
    test('keeps a newly created empty channel before the inbox returns it', () => {
        const fetchedChannel = createChannel('existing', '2026-01-02T00:00:00.000Z');
        const startedChannel = createChannel('started', null);

        expect(mergeDmChannels([[fetchedChannel]], [startedChannel])).toEqual([startedChannel, fetchedChannel]);
    });

    test('uses the fetched channel once it appears in the inbox', () => {
        const staleStartedChannel = createChannel('started', null);
        const fetchedStartedChannel = createChannel('started', '2026-01-03T00:00:00.000Z');

        expect(mergeDmChannels([[fetchedStartedChannel]], [staleStartedChannel])).toEqual([fetchedStartedChannel]);
    });
});

describe('mergeDmLastMessages', () => {
    test('keeps the previous preview while the replacement message is loading', () => {
        const previousMessage = createMessage('previous', 'channel-1', '2026-01-01T00:00:00.000Z');
        const channel = createChannel('channel-1', '2026-01-02T00:00:00.000Z');

        expect(mergeDmLastMessages([channel], new Map(), new Map([['channel-1', previousMessage]]))).toEqual(
            new Map([['channel-1', previousMessage]]),
        );
    });

    test('replaces the preview when the latest message finishes loading', () => {
        const previousMessage = createMessage('previous', 'channel-1', '2026-01-01T00:00:00.000Z');
        const latestMessage = createMessage('latest', 'channel-1', '2026-01-02T00:00:00.000Z');
        const channel = createChannel('channel-1', latestMessage.created_at);

        expect(
            mergeDmLastMessages(
                [channel],
                new Map([['channel-1', latestMessage]]),
                new Map([['channel-1', previousMessage]]),
            ),
        ).toEqual(new Map([['channel-1', latestMessage]]));
    });

    test('does not regress when the channel payload contains an older embedded message', () => {
        const embeddedMessage = createMessage('embedded', 'channel-1', '2026-01-01T00:00:00.000Z');
        const fetchedMessage = createMessage('fetched', 'channel-1', '2026-01-02T00:00:00.000Z');
        const channel = { ...createChannel('channel-1', fetchedMessage.created_at), last_message: embeddedMessage };

        expect(mergeDmLastMessages([channel], new Map([['channel-1', fetchedMessage]]), new Map())).toEqual(
            new Map([['channel-1', fetchedMessage]]),
        );
    });

    test('does not retain a preview for an empty channel', () => {
        const previousMessage = createMessage('previous', 'channel-1', '2026-01-01T00:00:00.000Z');

        expect(
            mergeDmLastMessages(
                [createChannel('channel-1', null)],
                new Map(),
                new Map([['channel-1', previousMessage]]),
            ),
        ).toEqual(new Map());
    });
});

describe('DM channel query keys', () => {
    test('keeps inbox and request results in separate caches', () => {
        const filter = { type: 'dm' as const };

        expect(dmKeys.channels('0xABC', filter, 'inbox')).not.toEqual(dmKeys.channels('0xABC', filter, 'requests'));
    });

    test('refreshes a fallback conversation preview when its latest timestamp changes', () => {
        expect(dmKeys.lastMessageVersion('0xABC', 'channel-1', '2026-01-01')).not.toEqual(
            dmKeys.lastMessageVersion('0xABC', 'channel-1', '2026-01-02'),
        );
    });
});

describe('DM read state', () => {
    test('clears the unread count for the selected channel', () => {
        const data: InfiniteData<ChatChannel[], number> = {
            pages: [[createChannel('selected', null, 3), createChannel('other', null, 2)]],
            pageParams: [0],
        };

        expect(getChannelUnreadCount(data, 'selected')).toBe(3);
        const markedData = markChannelRead(data, 'selected', 'latest-message');

        expect(markedData?.pages[0]?.[0]?.channel_membership).toMatchObject({
            unread_count: 0,
            last_read_message_id: 'latest-message',
        });
        expect(markChannelRead(data, 'selected')?.pages[0]?.[1]?.channel_membership.unread_count).toBe(2);
    });

    test('uses the selected conversation count after an unread query has removed it', () => {
        expect(getChannelUnreadCountAcrossQueries([], 'selected', 3)).toBe(3);
    });

    test('updates the aggregate unread counters without going below zero', () => {
        const counters: ChannelCounters = {
            total_unread_count: 3,
            total_channels_count: 2,
            total_unread_channels_count: 1,
            total_unread_dms_count: 1,
            total_unread_clubs_count: 0,
            requests_count: 0,
        };

        expect(markCountersRead(counters, 3)).toMatchObject({
            total_unread_count: 0,
            total_unread_channels_count: 0,
            total_unread_dms_count: 0,
        });
    });

    test('does not touch the DM/channel counters when reading a message request', () => {
        const counters: ChannelCounters = {
            total_unread_count: 5,
            total_channels_count: 2,
            total_unread_channels_count: 2,
            total_unread_dms_count: 2,
            total_unread_clubs_count: 0,
            requests_count: 1,
        };

        // Requests are surfaced via requests_count, so the sidebar DM badge must stay put.
        expect(markCountersRead(counters, 3, true)).toMatchObject({
            total_unread_count: 2,
            total_unread_channels_count: 2,
            total_unread_dms_count: 2,
        });
    });
});

describe('resolveSentDmMessage', () => {
    test('keeps uploaded attachments when the send response omits them', () => {
        const attachment: MediaAttachment = {
            __typename: 'MediaImage',
            id: 'image-1',
            index: 0,
            item: 'https://s3.example/image.png',
            raw: 'https://s3.example/image.png',
            type: 'image/png',
        };
        const optimisticMessage: ChatMessage = {
            id: 'message-1',
            channel_id: 'channel-1',
            author_id: '0x1234',
            content: null,
            parent_message_id: null,
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
            sticker_id: null,
            shared_publication_id: null,
            offer_id: null,
            sale_id: null,
            interactive_action_id: null,
            author_profile: { address: '0x1234', name: null, handle: null },
            attachments: [{ ...attachment, item: 'blob:preview', raw: 'blob:preview' }],
            send_status: 'pending',
            is_optimistic: true,
        };
        const responseMessage = { ...optimisticMessage, attachments: [], send_status: undefined };

        expect(resolveSentDmMessage(optimisticMessage, responseMessage, [attachment])).toMatchObject({
            attachments: [attachment],
            send_status: 'sent',
            is_optimistic: false,
        });
    });
});
