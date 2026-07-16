import { type SocialSource, Source } from '@dimensiondev/enums';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Channel } from '@/providers/types/SocialMedia.js';

const mocks = vi.hoisted(() => ({ hasJoined: vi.fn() }));

vi.mock('@/store/useJoinedChannelStore.js', () => ({
    useJoinedChannelStore: { getState: () => ({ hasJoined: mocks.hasJoined }) },
}));

const { applyOptimisticLensChannelMembership, applyOptimisticLensChannelMemberships } =
    await import('@/providers/lens/applyOptimisticLensChannelMembership.js');

function channel(source: SocialSource = Source.Lens): Channel {
    return {
        source,
        id: '0x1234567890123456789012345678901234567890',
        name: 'Club',
        imageUrl: '',
        url: '',
        parentUrl: '',
        followerCount: 1,
        timestamp: 0,
        membershipStatus: 'join',
        isMember: false,
        canJoin: true,
        canLeave: false,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasJoined.mockReturnValue(false);
});

describe('applyOptimisticLensChannelMembership', () => {
    it('applies a confirmed local Lens membership to stale channel data', () => {
        mocks.hasJoined.mockReturnValue(true);
        const club = channel();

        expect(applyOptimisticLensChannelMembership(club, '0xprofile')).toMatchObject({
            membershipStatus: 'joined',
            isMember: true,
            canJoin: false,
            canLeave: true,
        });
        expect(mocks.hasJoined).toHaveBeenCalledWith('0xprofile', club.id);
    });

    it('does not change other sources or Lens clubs without an override', () => {
        const lensClub = channel();
        const farcasterChannel = channel(Source.Farcaster);

        expect(applyOptimisticLensChannelMembership(lensClub, '0xprofile')).toBe(lensClub);
        expect(applyOptimisticLensChannelMembership(farcasterChannel, '0xprofile')).toBe(farcasterChannel);
        expect(mocks.hasJoined).toHaveBeenCalledOnce();
    });

    it('normalizes lists through the shared overlay', () => {
        mocks.hasJoined.mockReturnValue(true);
        expect(applyOptimisticLensChannelMemberships([channel()], '0xprofile')[0]?.membershipStatus).toBe('joined');
    });
});
