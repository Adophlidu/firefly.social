import { HomeTab } from '@/constants/enum.js';
import { SOCIAL_DISCOVER_SOURCE } from '@/constants/index.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { useDiscoverStore } from '@/store/useDiscoverStore.js';

const LOGIN_REQUEST = [HomeTab.Following];

export function useDiscoverSources(tab: HomeTab) {
    const profilesAll = useCurrentProfilesAll();
    const sources = useDiscoverStore((state) =>
        SOCIAL_DISCOVER_SOURCE.filter((x) => state.postTimelinePlatforms[tab].includes(x)),
    );
    const filteredSources = LOGIN_REQUEST.includes(tab)
        ? sources.filter((source) => !!profilesAll[source]?.profileId)
        : sources;
    return filteredSources.length <= 0 ? SOCIAL_DISCOVER_SOURCE : filteredSources;
}
