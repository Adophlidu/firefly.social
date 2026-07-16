import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ensureLensGroupMembership } from '@/providers/lens/ensureLensGroupMembership.js';

// Hoist the mocks so vi.mock factories (which are hoisted above imports) can
// reference them without hitting the temporal-dead-zone.
const mocks = vi.hoisted(() => ({
    hasJoined: vi.fn<(profileId: string, channelId: string) => boolean>(),
    markJoined: vi.fn<(profileId: string, channelId: string) => void>(),
    getChannelById: vi.fn(),
    joinChannel: vi.fn(),
}));

vi.mock('@/providers/lens/SocialMedia.js', () => ({
    lensSocialMediaProvider: {
        getChannelById: mocks.getChannelById,
        joinChannel: mocks.joinChannel,
    },
}));

vi.mock('@/store/useJoinedChannelStore.js', () => ({
    useJoinedChannelStore: {
        getState: () => ({ hasJoined: mocks.hasJoined, markJoined: mocks.markJoined }),
    },
}));

const PROFILE_ID = '0x01';
const GROUP_ADDRESS = '0x230c140a85af16aa444ba87e0823e5c62cfe3366';

beforeEach(() => {
    mocks.hasJoined.mockReset();
    mocks.markJoined.mockReset();
    mocks.getChannelById.mockReset();
    mocks.joinChannel.mockReset();
});

describe('ensureLensGroupMembership', () => {
    it('skips the network entirely when the optimistic store already records membership', async () => {
        mocks.hasJoined.mockReturnValue(true);

        await ensureLensGroupMembership(PROFILE_ID, GROUP_ADDRESS);

        expect(mocks.getChannelById).not.toHaveBeenCalled();
        expect(mocks.joinChannel).not.toHaveBeenCalled();
        expect(mocks.markJoined).not.toHaveBeenCalled();
    });

    it('records membership without joining when the profile is already a member', async () => {
        mocks.hasJoined.mockReturnValue(false);
        mocks.getChannelById.mockResolvedValue({ isMember: true });

        await ensureLensGroupMembership(PROFILE_ID, GROUP_ADDRESS);

        expect(mocks.getChannelById).toHaveBeenCalledWith(GROUP_ADDRESS, true, undefined, PROFILE_ID);
        expect(mocks.joinChannel).not.toHaveBeenCalled();
        expect(mocks.markJoined).toHaveBeenCalledWith(PROFILE_ID, GROUP_ADDRESS);
    });

    it('joins the group then records membership when the profile is not a member', async () => {
        mocks.hasJoined.mockReturnValue(false);
        const channel = { id: GROUP_ADDRESS, isMember: false };
        mocks.getChannelById.mockResolvedValue(channel);
        mocks.joinChannel.mockResolvedValue(true);

        await ensureLensGroupMembership(PROFILE_ID, GROUP_ADDRESS);

        expect(mocks.getChannelById).toHaveBeenCalledWith(GROUP_ADDRESS, true, undefined, PROFILE_ID);
        expect(mocks.joinChannel).toHaveBeenCalledWith(channel);
        expect(mocks.markJoined).toHaveBeenCalledWith(PROFILE_ID, GROUP_ADDRESS);
    });

    it('propagates a join error so the caller can surface it', async () => {
        mocks.hasJoined.mockReturnValue(false);
        mocks.getChannelById.mockResolvedValue({ isMember: false });
        mocks.joinChannel.mockRejectedValue(new Error('FeedGroupGatedNotAMember'));

        await expect(ensureLensGroupMembership(PROFILE_ID, GROUP_ADDRESS)).rejects.toThrow('FeedGroupGatedNotAMember');
        expect(mocks.markJoined).not.toHaveBeenCalled();
    });
});
