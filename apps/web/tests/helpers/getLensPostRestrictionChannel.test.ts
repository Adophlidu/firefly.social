import { Source } from '@dimensiondev/enums';
import { describe, expect, it } from 'vitest';

import { HOME_CLUB } from '@/constants/channel.js';
import { getLensPostRestrictionChannel } from '@/helpers/getLensPostRestrictionChannel.js';
import type { Channel, ChannelMembershipStatus } from '@/providers/types/SocialMedia.js';

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
    it('does not require membership for the Lens Home feed', () => {
        expect(getLensPostRestrictionChannel([{ channel: HOME_CLUB, enabled: true }])).toBeUndefined();
    });

    it('returns the first non-member club and ignores joined and empty channels', () => {
        const restricted = channel('request-club', 'requestToJoin');
        expect(
            getLensPostRestrictionChannel([
                { channel: null, enabled: true },
                { channel: channel('joined-club', 'joined'), enabled: true },
                { channel: restricted, enabled: true },
            ]),
        ).toBe(restricted);
    });

    it('returns undefined when every selected Lens club is joined', () => {
        expect(
            getLensPostRestrictionChannel([{ channel: channel('joined-club', 'joined'), enabled: true }]),
        ).toBeUndefined();
    });

    it('ignores a stale club selection when Lens is disabled for the post', () => {
        expect(
            getLensPostRestrictionChannel([{ channel: channel('request-club', 'requestToJoin'), enabled: false }]),
        ).toBeUndefined();
    });
});
