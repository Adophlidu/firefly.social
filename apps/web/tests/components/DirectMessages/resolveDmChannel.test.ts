import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createChat, getChatChannel, getChatChannelByUser } from '@/providers/orb/chat/api.js';
import { resolveDmChannel } from '@/providers/orb/chat/resolveDmChannel.js';
import type { ChatChannel } from '@/providers/orb/chat/types.js';

vi.mock('@/providers/orb/chat/api.js', () => ({
    ChatApiError: class ChatApiError extends Error {},
    createChat: vi.fn(),
    getChatChannel: vi.fn(),
    getChatChannelByUser: vi.fn(),
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
        vi.mocked(getChatChannelByUser).mockReset();
    });

    test('reuses the channel returned for the other Lens account', async () => {
        const existingChannel = createChannel('existing', '0xTarget');
        vi.mocked(getChatChannelByUser).mockResolvedValue(existingChannel);

        await expect(resolveDmChannel('0xViewer', '0xtarget')).resolves.toBe(existingChannel);
        expect(getChatChannelByUser).toHaveBeenCalledWith('0xViewer', '0xtarget');
        expect(createChat).not.toHaveBeenCalled();
    });

    test('deduplicates concurrent channel creation', async () => {
        const createdChannel = createChannel('created', '0xTarget');
        vi.mocked(getChatChannelByUser).mockResolvedValue(null);
        vi.mocked(createChat).mockResolvedValue('created');
        vi.mocked(getChatChannel).mockResolvedValue(createdChannel);

        const firstResolution = resolveDmChannel('0xViewer', '0xTarget');
        const secondResolution = resolveDmChannel('0xviewer', '0xtarget');

        expect(firstResolution).toBe(secondResolution);
        await expect(firstResolution).resolves.toBe(createdChannel);
        expect(createChat).toHaveBeenCalledOnce();
    });
});
