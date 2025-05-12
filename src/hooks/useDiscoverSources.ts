import { HomeTab, type SocialDiscoverSource } from '@/constants/enum.js';
import { SOCIAL_DISCOVER_SOURCE } from '@/constants/index.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { useSocialDiscoverSourcesWithWhitelist } from '@/hooks/useSocialDiscoverSourcesWithWhitelist.js';
import { useDiscoverStore } from '@/store/useDiscoverStore.js';

const LOGIN_REQUEST = [HomeTab.Following];

export function useDiscoverSources(tab: HomeTab) {
    const profilesAll = useCurrentProfilesAll();
    const socialDiscoverSourcesWithWhitelist = useSocialDiscoverSourcesWithWhitelist();
    const sourcesByTab: Record<HomeTab, SocialDiscoverSource[]> = {
        [HomeTab.Discover]: socialDiscoverSourcesWithWhitelist,
        [HomeTab.Following]: SOCIAL_DISCOVER_SOURCE,
    };
    const sources = sourcesByTab[tab];
    const selectedSources = useDiscoverStore((state) =>
        sources.filter((x) => state.postTimelinePlatforms[tab].includes(x)),
    );
    const filteredSourcesByLogin = LOGIN_REQUEST.includes(tab)
        ? selectedSources.filter((source) => !!profilesAll[source]?.profileId)
        : selectedSources;
    return filteredSourcesByLogin.length <= 0 ? sources : filteredSourcesByLogin;
}
