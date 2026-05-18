import type { SocialSource } from '@dimensiondev/enums';
import { HomeTab } from '@dimensiondev/enums';

import { SORTED_SOCIAL_SOURCES } from '@/constants/computed.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { useSocialDiscoverSourcesWithWhitelist } from '@/hooks/useSocialDiscoverSourcesWithWhitelist.js';

export function useIsLogin(source?: SocialSource) {
    const profilesAll = useCurrentProfilesAll();

    if (source) return !!profilesAll[source]?.profileId;
    return SORTED_SOCIAL_SOURCES.some((x) => !!profilesAll[x]?.profileId);
}

export function useIsLoginDiscoverSource() {
    const sources = useSocialDiscoverSourcesWithWhitelist(HomeTab.Following);
    const profilesAll = useCurrentProfilesAll();
    return sources.some((source) => !!profilesAll[source]?.profileId);
}
