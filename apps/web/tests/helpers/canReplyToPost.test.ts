import { Source } from '@dimensiondev/enums';
import { describe, expect, it, vi } from 'vitest';

import { createDummyPost } from '@/helpers/createDummyPost.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import type { Channel, Post } from '@/providers/types/SocialMedia.js';

const mocks = vi.hoisted(() => ({
    getChannelById: vi.fn(),
}));

vi.mock('@/helpers/resolveSocialMediaProvider.js', () => ({
    resolveSocialMediaProvider: () => ({
        getChannelById: mocks.getChannelById,
    }),
}));

const { canReplyToPost } = await import('@/helpers/canReplyToPost.js');

const PROFILE_ADDRESS = '0x1111111111111111111111111111111111111111';
const GROUP_ADDRESS = '0x2222222222222222222222222222222222222222';

function createClubGatedPost(): Post {
    return {
        ...createDummyPost(Source.Lens, 'Club post'),
        postId: '0x01-0x01',
        canComment: false,
        replyRestriction: {
            clubGated: true,
            clubAddress: GROUP_ADDRESS,
        },
    };
}

function createClub(membershipStatus: Channel['membershipStatus']): Channel {
    return {
        source: Source.Lens,
        id: GROUP_ADDRESS,
        name: 'Club',
        imageUrl: '',
        url: '',
        parentUrl: '',
        followerCount: 1,
        timestamp: 0,
        membershipStatus,
        isMember: membershipStatus === 'joined',
    };
}

describe('canReplyToPost', () => {
    it('allows a reply when the current Lens account is a member despite stale timeline operations', async () => {
        mocks.getChannelById.mockResolvedValue(createClub('joined'));
        const profile = {
            ...createDummyProfile(Source.Lens),
            profileId: PROFILE_ADDRESS,
        };

        await expect(canReplyToPost(createClubGatedPost(), profile)).resolves.toBe(true);
        expect(mocks.getChannelById).toHaveBeenCalledWith(GROUP_ADDRESS, true, undefined, PROFILE_ADDRESS);
    });

    it('keeps the reply restricted when the current Lens account is not a member', async () => {
        mocks.getChannelById.mockResolvedValue(createClub('join'));
        const profile = {
            ...createDummyProfile(Source.Lens),
            profileId: PROFILE_ADDRESS,
        };

        await expect(canReplyToPost(createClubGatedPost(), profile)).resolves.toBe(false);
    });
});
