import { useQuery } from '@tanstack/react-query';

import { HomeTab } from '@/constants/enum.js';
import {
    SOCIAL_DISCOVER_SOURCE,
    SOCIAL_DISCOVER_WHITELIST_SOURCE,
    TWITTER_TIMELINE_WHITELIST_JSON_URL,
} from '@/constants/index.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { useCurrentFireflyAccountUID } from '@/hooks/useCurrentFireflyAccountUID.js';

export function useSocialDiscoverSourcesWithWhitelist(tab: HomeTab) {
    const fireflyUID = useCurrentFireflyAccountUID();
    const { data: isWhitelist = false } = useQuery({
        queryKey: ['twitter-timeline-white-list', fireflyUID],
        async queryFn() {
            const list = await fetchJSON<Array<{ uid: string }>>(TWITTER_TIMELINE_WHITELIST_JSON_URL);
            return list.some((x) => x.uid === fireflyUID);
        },
        enabled: !!fireflyUID && tab === HomeTab.Following,
    });
    if (tab !== HomeTab.Following) return SOCIAL_DISCOVER_SOURCE;
    return isWhitelist ? [...SOCIAL_DISCOVER_SOURCE, ...SOCIAL_DISCOVER_WHITELIST_SOURCE] : SOCIAL_DISCOVER_SOURCE;
}
