import { useQuery } from '@tanstack/react-query';

import { Source } from '@/constants/enum.js';
import {
    SOCIAL_DISCOVER_SOURCE,
    SOCIAL_DISCOVER_WHITELIST_SOURCE,
    TWITTER_TIMELINE_WHITELIST_JSON_URL,
} from '@/constants/index.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { useCurrentFireflyAccountUID } from '@/hooks/useCurrentFireflyAccountUID.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';

export function useSocialDiscoverSourcesWithWhitelist() {
    const fireflyUID = useCurrentFireflyAccountUID();
    const isLoginTwitter = useIsLogin(Source.Twitter);
    const { data: isWhitelist = false } = useQuery({
        queryKey: ['twitter-timeline-white-list', fireflyUID],
        async queryFn() {
            const list = await fetchJSON<Array<{ uid: string }>>(TWITTER_TIMELINE_WHITELIST_JSON_URL);
            return list.some((x) => x.uid === fireflyUID);
        },
        enabled: isLoginTwitter && !!fireflyUID,
    });
    return isWhitelist ? [...SOCIAL_DISCOVER_SOURCE, ...SOCIAL_DISCOVER_WHITELIST_SOURCE] : SOCIAL_DISCOVER_SOURCE;
}
