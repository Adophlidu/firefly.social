import TWITTER_TIMELINE_WHITELIST from '@/assets/twitter-timeline-whitelist.json' with { type: 'json' };
import { HomeTab } from '@/constants/enum.js';
import { SOCIAL_DISCOVER_SOURCE, SOCIAL_DISCOVER_WHITELIST_SOURCE } from '@/constants/index.js';
import { useCurrentFireflyAccountUID } from '@/hooks/useCurrentFireflyAccountUID.js';

export function useSocialDiscoverSourcesWithWhitelist(tab: HomeTab) {
    const fireflyUID = useCurrentFireflyAccountUID();
    const isWhitelist = TWITTER_TIMELINE_WHITELIST.some((x) => x.uid === fireflyUID);
    if (tab !== HomeTab.Following) return SOCIAL_DISCOVER_SOURCE;
    return isWhitelist ? [...SOCIAL_DISCOVER_SOURCE, ...SOCIAL_DISCOVER_WHITELIST_SOURCE] : SOCIAL_DISCOVER_SOURCE;
}
