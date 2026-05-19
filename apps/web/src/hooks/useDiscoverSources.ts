import { SOCIAL_DISCOVER_SOURCE } from '@dimensiondev/constants/computed';
import { HomeTab, type SocialDiscoverSource } from '@dimensiondev/enums';

import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { useDiscoverStoreWithTab } from '@/hooks/useDiscoverStoreWithTab.js';
import { useSocialDiscoverSourcesWithWhitelist } from '@/hooks/useSocialDiscoverSourcesWithWhitelist.js';

const LOGIN_REQUEST = [HomeTab.Following];

export function useDiscoverSources(tab: HomeTab) {
    const profilesAll = useCurrentProfilesAll();
    const followingTimelineSourcesWithWhitelist = useSocialDiscoverSourcesWithWhitelist(tab);
    const { selectedSources } = useDiscoverStoreWithTab(tab);

    const sourcesByTab: Record<HomeTab, SocialDiscoverSource[]> = {
        [HomeTab.Discover]: SOCIAL_DISCOVER_SOURCE,
        [HomeTab.Following]: followingTimelineSourcesWithWhitelist,
    };
    const sources = LOGIN_REQUEST.includes(tab)
        ? sourcesByTab[tab].filter((source) => !!profilesAll[source]?.profileId)
        : sourcesByTab[tab];
    const validSelectedSources = sources.filter((x) => selectedSources.includes(x));

    return {
        sources: validSelectedSources.length <= 0 ? sources : validSelectedSources,
        selectedSources: validSelectedSources,
    };
}
