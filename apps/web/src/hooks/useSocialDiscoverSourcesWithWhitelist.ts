import { SOCIAL_DISCOVER_SOURCE, SOCIAL_DISCOVER_WHITELIST_SOURCE } from '@dimensiondev/constants/computed';
import { HomeTab } from '@dimensiondev/enums';

import { TWITTER_TIMELINE_WHITELIST_UID_SET } from '@/constants/twitterTimelineWhitelist.js';
import { useCurrentFireflyAccountUID } from '@/hooks/useCurrentFireflyAccountUID.js';

export function useSocialDiscoverSourcesWithWhitelist(tab: HomeTab) {
    const fireflyUID = useCurrentFireflyAccountUID();
    const isWhitelist = fireflyUID ? TWITTER_TIMELINE_WHITELIST_UID_SET.has(fireflyUID) : false;
    if (tab !== HomeTab.Following) return SOCIAL_DISCOVER_SOURCE;
    return isWhitelist ? [...SOCIAL_DISCOVER_WHITELIST_SOURCE, ...SOCIAL_DISCOVER_SOURCE] : SOCIAL_DISCOVER_SOURCE;
}
