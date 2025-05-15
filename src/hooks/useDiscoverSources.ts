import { HomeTab, type SocialDiscoverSource } from '@/constants/enum.js';
import { SOCIAL_DISCOVER_SOURCE } from '@/constants/index.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { useSocialDiscoverSourcesWithWhitelist } from '@/hooks/useSocialDiscoverSourcesWithWhitelist.js';
import { useDiscoverStore } from '@/store/useDiscoverStore.js';

const LOGIN_REQUEST = [HomeTab.Following];

export function useDiscoverSources(tab: HomeTab) {
    const profilesAll = useCurrentProfilesAll();
    const followingTimelineSourcesWithWhitelist = useSocialDiscoverSourcesWithWhitelist(tab);
    const sourcesByTab: Record<HomeTab, SocialDiscoverSource[]> = {
        [HomeTab.Discover]: SOCIAL_DISCOVER_SOURCE,
        [HomeTab.Following]: followingTimelineSourcesWithWhitelist,
    };
    const sources = LOGIN_REQUEST.includes(tab)
        ? sourcesByTab[tab].filter((source) => !!profilesAll[source]?.profileId)
        : sourcesByTab[tab];
    const selectedSources = useDiscoverStore((state) =>
        sources.filter((x) => state.postTimelinePlatforms[tab].includes(x)),
    );
    return selectedSources.length <= 0 ? sources : selectedSources;
}
