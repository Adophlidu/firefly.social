import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createChat, getChatChannel, getChatChannels } from '@/providers/orb/chat/api.js';
import { CHAT_CHANNEL_PAGE_LIMIT } from '@/providers/orb/chat/constants.js';
import { isDmChannelForTarget, resolveDmChannel } from '@/providers/orb/chat/resolveDmChannel.js';
import type { ChatChannel } from '@/providers/orb/chat/types.js';

vi.mock('@/providers/orb/chat/api.js', () => ({
    ChatApiError: class ChatApiError extends Error {},
    createChat: vi.fn(),
    getChatChannel: vi.fn(),
    getChatChannels: vi.fn(),
}));

function createChannel(id: string, targetAccount: string): ChatChannel {
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
        last_message_at: null,
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
            unread_count: 0,
            last_read_message_id: null,
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
        },
        other_member_profile: {
            id: targetAccount,
            address: targetAccount,
            name: id,
            handle: id,
        },
        total_members: 2,
    };
}

describe('resolveDmChannel', () => {
    beforeEach(() => {
        vi.mocked(createChat).mockReset();
        vi.mocked(getChatChannel).mockReset();
        vi.mocked(getChatChannels).mockReset();
    });

    test('matches an existing channel by Lens account address', () => {
        const channel = createChannel('existing', '0xAbC');

        expect(isDmChannelForTarget(channel, ' 0xaBc ')).toBe(true);
    });

    test('reuses an existing channel from a later page', async () => {
        const firstPage = Array.from({ length: CHAT_CHANNEL_PAGE_LIMIT }, (_, index) =>
            createChannel(`other-${index}`, `0x${index}`),
        );
        const existingChannel = createChannel('existing', '0xTarget');
        vi.mocked(getChatChannels).mockResolvedValueOnce(firstPage).mockResolvedValueOnce([existingChannel]);

        await expect(resolveDmChannel('0xViewer', '0xtarget')).resolves.toBe(existingChannel);
        expect(getChatChannels).toHaveBeenNthCalledWith(2, '0xViewer', {
            type: 'dm',
            cursor: CHAT_CHANNEL_PAGE_LIMIT,
        });
        expect(createChat).not.toHaveBeenCalled();
    });

    test('deduplicates concurrent channel creation', async () => {
        const createdChannel = createChannel('created', '0xTarget');
        vi.mocked(getChatChannels).mockResolvedValue([]);
        vi.mocked(createChat).mockResolvedValue('created');
        vi.mocked(getChatChannel).mockResolvedValue(createdChannel);

        const firstResolution = resolveDmChannel('0xViewer', '0xTarget');
        const secondResolution = resolveDmChannel('0xviewer', '0xtarget');

        expect(firstResolution).toBe(secondResolution);
        await expect(firstResolution).resolves.toBe(createdChannel);
        expect(createChat).toHaveBeenCalledOnce();
    });
});
