import { Source } from '@dimensiondev/enums';
import { describe, expect, it, vi } from 'vitest';

import { HOME_CLUB } from '@/constants/channel.js';
import type { Channel, ChannelMembershipStatus } from '@/providers/types/SocialMedia.js';

const mocks = vi.hoisted(() => ({
    getChannelById: vi.fn(),
}));

vi.mock('@/helpers/resolveSocialMediaProvider.js', () => ({
    resolveSocialMediaProvider: () => ({
        getChannelById: mocks.getChannelById,
    }),
}));

const { getLensPostRestrictionChannel } = await import('@/helpers/getLensPostRestrictionChannel.js');

function channel(id: string, membershipStatus: ChannelMembershipStatus): Channel {
    return {
        source: Source.Lens,
        id,
        name: id,
        imageUrl: '',
        url: '',
        parentUrl: '',
        followerCount: 0,
        timestamp: 0,
        membershipStatus,
        isMember: membershipStatus === 'joined',
    };
}

describe('getLensPostRestrictionChannel', () => {
    it('does not require membership for the Lens Home feed', async () => {
        await expect(getLensPostRestrictionChannel([{ channel: HOME_CLUB, enabled: true }])).resolves.toBeUndefined();
    });

    it('returns the first non-member club and ignores joined and empty channels', async () => {
        const restricted = channel('request-club', 'requestToJoin');
        await expect(
            getLensPostRestrictionChannel([
                { channel: null, enabled: true },
                { channel: channel('joined-club', 'joined'), enabled: true },
                { channel: restricted, enabled: true },
            ]),
        ).resolves.toBe(restricted);
    });

    it('returns undefined when every selected Lens club is joined', async () => {
        await expect(
            getLensPostRestrictionChannel([{ channel: channel('joined-club', 'joined'), enabled: true }]),
        ).resolves.toBeUndefined();
    });

    it('ignores a stale club selection when Lens is disabled for the post', async () => {
        await expect(
            getLensPostRestrictionChannel([{ channel: channel('request-club', 'requestToJoin'), enabled: false }]),
        ).resolves.toBeUndefined();
    });

    it('re-checks stale post channel data with the current Lens profile before blocking send', async () => {
        const staleChannel = channel('0x230c140a85af16aa444ba87e0823e5c62cfe3366', 'join');
        mocks.getChannelById.mockResolvedValue(channel(staleChannel.id, 'joined'));

        await expect(
            getLensPostRestrictionChannel([{ channel: staleChannel, enabled: true }], '0xprofile'),
        ).resolves.toBeUndefined();
        expect(mocks.getChannelById).toHaveBeenCalledWith(staleChannel.id, true, undefined, '0xprofile');
    });

    it('returns the refreshed channel when the current Lens profile is not a member', async () => {
        const staleChannel = channel('0x230c140a85af16aa444ba87e0823e5c62cfe3366', 'join');
        const refreshedChannel = channel(staleChannel.id, 'requestToJoin');
        mocks.getChannelById.mockResolvedValue(refreshedChannel);

        await expect(
            getLensPostRestrictionChannel([{ channel: staleChannel, enabled: true }], '0xprofile'),
        ).resolves.toBe(refreshedChannel);
    });
});
