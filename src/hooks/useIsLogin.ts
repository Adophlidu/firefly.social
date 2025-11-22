import { HomeTab, type SocialSource } from '@/constants/enum.js';
import { SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
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
