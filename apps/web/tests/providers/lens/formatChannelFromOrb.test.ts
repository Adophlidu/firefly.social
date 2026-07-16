import { describe, expect, it } from 'vitest';

import { formatChannelFromOrb } from '@/providers/lens/formatChannelFromOrb.js';
import type { OrbClub } from '@/providers/orb/type.js';

function club(operations: OrbClub['operations']): OrbClub {
    return {
        type: 'club',
        id: 'club-id',
        metadata: {
            address: '0x1234567890123456789012345678901234567890',
            name: 'Club',
            feed: '0xfeed',
        },
        operations,
    };
}

describe('formatChannelFromOrb', () => {
    it('keeps eligible and ineligible non-member clubs visible when posting requires membership', () => {
        const eligible = formatChannelFromOrb(club({ isMember: false, isEligible: true, canPost: false }));
        const ineligible = formatChannelFromOrb(club({ isMember: false, isEligible: false, canPost: false }));

        expect(eligible).toMatchObject({ unavailable: false, membershipStatus: 'join' });
        expect(ineligible).toMatchObject({ unavailable: false, membershipStatus: 'notEligible' });
    });

    it('keeps an existing member club unavailable when the member cannot post', () => {
        expect(formatChannelFromOrb(club({ isMember: true, canPost: false }))).toMatchObject({
            unavailable: true,
            membershipStatus: 'joined',
        });
    });
});
