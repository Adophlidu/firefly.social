import { PageRoute, Source } from '@dimensiondev/enums';

import { TWITTER_TIMELINE_WHITELIST_UID_SET } from '@/constants/twitterTimelineWhitelist.js';
import { getCurrentAvailableSources } from '@/helpers/getCurrentAvailableSources.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { logger } from '@/libs/Logger.js';

export function getSignupRedirectPath() {
    try {
        const sources = getCurrentAvailableSources();
        if (sources.length === 1 && sources[0] === Source.Twitter) {
            const twitterProfile = getCurrentProfileFromStorage(Source.Twitter);
            if (!twitterProfile?.profileId || !TWITTER_TIMELINE_WHITELIST_UID_SET.has(twitterProfile.profileId))
                return PageRoute.DiscoverPosts;
        }

        return PageRoute.FollowingPosts;
    } catch (error) {
        logger.error('Failed to get signup redirect path', error);
        return PageRoute.FollowingPosts;
    }
}
