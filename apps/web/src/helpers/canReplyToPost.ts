import { safeUnreachable } from '@dimensiondev/utils';
import { isUndefined } from 'lodash-es';

import { queryClient } from '@/configs/queryClient.js';
import { RestrictionType, Source } from '@/constants/enum.js';
import { STALE_TIMES } from '@/constants/query.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { type Post, type Profile } from '@/providers/types/SocialMedia.js';

// https://mask.atlassian.net/browse/FW-7132
function canReplyToTwitterPost(post: Post, currentProfile: Profile) {
    // Self-reply
    if (isSameProfile(post.author, currentProfile)) return true;

    // Mentioned
    const mentions = post.mentions;
    if (mentions?.some((mention) => isSameProfile(mention, currentProfile))) return true;

    // Quote-on
    if (post.quoteOn && isSameProfile(post.quoteOn.author, currentProfile)) return true;

    return false;
}

async function checkPostRestrictions(post: Post, currentProfile: Profile) {
    const { source, restrictions, mentions, author } = post;
    if (!restrictions?.length) return true;

    for (const restriction of restrictions) {
        switch (restriction) {
            case RestrictionType.Nobody:
                return isSameProfile(currentProfile, post.author);
            case RestrictionType.Everyone:
                return true;
            case RestrictionType.MentionedProfiles:
                if (mentions?.some((x) => isSameProfile(x, currentProfile))) return true;
                break;
            case RestrictionType.YouFollower:
            case RestrictionType.OnlyPeopleYouFollow:
                const profile = await queryClient.fetchQuery({
                    queryKey: ['profile', source, author.profileId, currentProfile?.profileId],
                    staleTime: STALE_TIMES.MINUTE_10,
                    queryFn: () => resolveSocialMediaProvider(source).getProfileById(author.profileId),
                });
                if (restriction === RestrictionType.YouFollower && !!profile.viewerContext?.following) return true;
                if (restriction === RestrictionType.OnlyPeopleYouFollow && !!profile.viewerContext?.followedBy)
                    return true;
                break;
            default:
                safeUnreachable(restriction);
                return true;
        }
    }

    return false;
}

export async function canReplyToPost(post: Post) {
    const source = post.source;
    const currentProfile = getCurrentProfileFromStorage(source);
    if (!currentProfile) return false;

    if (!isUndefined(post.canComment)) return !!post.canComment;

    switch (source) {
        case Source.Twitter:
            return canReplyToTwitterPost(post, currentProfile);
        case Source.Farcaster:
            return true;
        case Source.Lens:
        case Source.Bsky:
            return checkPostRestrictions(post, currentProfile);
        default:
            safeUnreachable(source);
            return false;
    }
}
