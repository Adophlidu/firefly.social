import type { SocialSource } from '@dimensiondev/enums';
import { useMemo } from 'react';

import { HomeTab } from '@/constants/enum.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { useDiscoverStore } from '@/store/useDiscoverStore.js';

export function useDiscoverStoreWithTab(tab: HomeTab) {
    const { postTimelinePlatforms, setFilteredPlatform, resetFilteredPlatform } = useDiscoverStore();
    const profileAll = useCurrentProfilesAll();

    const selectedSources = useMemo(() => {
        if (tab !== HomeTab.Following) return postTimelinePlatforms[tab];

        return postTimelinePlatforms[tab].filter((source) => {
            return !!profileAll[source]?.profileId;
        });
    }, [postTimelinePlatforms, tab, profileAll]);

    return {
        selectedSources,
        setFilteredPlatform: (source: SocialSource | SocialSource[]) => setFilteredPlatform(tab, source),
        resetFilteredPlatform: () => resetFilteredPlatform(tab),
    };
}
