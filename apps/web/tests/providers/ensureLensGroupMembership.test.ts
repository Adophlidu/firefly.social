import { Source } from '@dimensiondev/enums';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HOME_CLUB, WORLDCUP_2026_GROUP, WORLDCUP_2026_GROUP_ADDRESS } from '@/constants/channel.js';
import {
    ensureLensGroupMembership,
    resolveLensGroupAddressForSilentJoin,
} from '@/providers/lens/ensureLensGroupMembership.js';
import type { Account } from '@/providers/types/Account.js';
import type { Channel, Profile } from '@/providers/types/SocialMedia.js';

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
const PRIVY_PROFILE_TYPES = ['AccountManaged', 'AccountOwned'] satisfies Array<NonNullable<Profile['profileType']>>;

function account(profileType?: Profile['profileType'], origin?: Account['origin']) {
    return {
        origin,
        profile: { profileType },
    };
}

function channel(overrides: Partial<Channel> = {}): Channel {
    return {
        source: Source.Lens,
        id: GROUP_ADDRESS,
        name: 'Club',
        imageUrl: '',
        url: '',
        parentUrl: '',
        followerCount: 0,
        timestamp: 0,
        ...overrides,
    };
}

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

describe('resolveLensGroupAddressForSilentJoin', () => {
    it.each(PRIVY_PROFILE_TYPES)('silently joins a normal club for Privy %s profiles', (profileType) => {
        expect(resolveLensGroupAddressForSilentJoin(account(profileType), channel())).toBe(GROUP_ADDRESS);
    });

    it('recognizes a Privy-restored account after its profile type was lost during refresh', () => {
        expect(resolveLensGroupAddressForSilentJoin(account(undefined, 'force_restore'), channel())).toBe(
            GROUP_ADDRESS,
        );
    });

    it('does not silently join a normal club for an ordinary Lens account', () => {
        expect(resolveLensGroupAddressForSilentJoin(account(), channel())).toBeUndefined();
    });

    it('preserves the existing unconditional WorldCup group join', () => {
        expect(
            resolveLensGroupAddressForSilentJoin(
                account(),
                channel({ id: WORLDCUP_2026_GROUP.id, feedId: WORLDCUP_2026_GROUP.feedId }),
            ),
        ).toBe(WORLDCUP_2026_GROUP_ADDRESS);
    });

    it('never tries to join the Home pseudo-channel', () => {
        expect(resolveLensGroupAddressForSilentJoin(account('AccountManaged'), HOME_CLUB)).toBeUndefined();
    });
});
