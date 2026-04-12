import type { Account, AccountMention } from '@lens-protocol/client';

import { Source } from '@/constants/enum.js';
import { IMAGE_KIT_AVATAR } from '@/constants/static.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { formatGroveImage } from '@/helpers/formatGroveImage.js';
import { formatImageUrl } from '@/helpers/formatImageUrl.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { sanitizeDStorageUrl } from '@/helpers/sanitizeDStorageUrl.js';
import { NetworkType, type Profile, ProfileStatus } from '@/providers/types/SocialMedia.js';

function getAvatar(profile: Account, namedTransform = IMAGE_KIT_AVATAR) {
    return formatImageUrl(
        sanitizeDStorageUrl(formatGroveImage(profile.metadata?.picture), undefined, false),
        namedTransform,
    );
}

function formatAccountOperationAbility(result: Account) {
    if (!result.operations) {
        return {
            canFollow: true,
            canUnfollow: true,
        };
    }

    const { canFollow, canUnfollow } = result.operations;

    return {
        canFollow:
            canFollow.__typename === 'AccountFollowOperationValidationPassed' ||
            (canFollow.__typename === 'AccountFollowOperationValidationFailed' && !canFollow.unsatisfiedRules),
        canUnfollow:
            canUnfollow.__typename === 'AccountFollowOperationValidationPassed' ||
            (canUnfollow.__typename === 'AccountFollowOperationValidationFailed' && !canUnfollow.unsatisfiedRules),
    };
}

export function formatLensProfileV3(result: Account): Profile {
    return {
        profileId: result.address,
        profileSource: Source.Lens,
        displayName: result.metadata?.name || result.username?.localName || '',
        handle: (result.username?.localName || result.metadata?.name) ?? '',
        fullHandle: result.username?.value || '',
        pfp: getAvatar(result) || getStampAvatarByProfileId(Source.Lens, result.address),
        bio: result.metadata?.bio ?? undefined,
        address: result.address ?? undefined,
        followerCount: 0,
        followingCount: 0,
        status: ProfileStatus.Active,
        verified: true,
        isProUser: 'hasSubscribed' in result ? result.hasSubscribed : false,
        signless: false,
        ownedBy: {
            networkType: NetworkType.Ethereum,
            address: result.owner,
        },
        viewerContext: {
            following: result.operations?.isFollowedByMe,
            followedBy: result.operations?.isFollowingMe,
            blocking: result.operations?.isMutedByMe,
        },
        ...formatAccountOperationAbility(result),
        source: Source.Lens,
        website: result.metadata?.attributes?.find((x) => x.key === 'website')?.value,
        location: result.metadata?.attributes?.find((x) => x.key === 'location')?.value,
    };
}

export function formatLensProfileByMention(mention: AccountMention): Profile {
    const handle = mention.replace.to?.replace(/^@/, '') || '';

    return {
        ...createDummyProfile(Source.Lens),
        profileId: mention.account,
        displayName: handle,
        handle,
        fullHandle: handle,
    };
}
