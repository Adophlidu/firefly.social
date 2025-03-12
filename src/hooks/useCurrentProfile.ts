import { compact, first } from 'lodash-es';
import { useMemo } from 'react';

import { type SocialSource, Source } from '@/constants/enum.js';
import { SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import {
    useBskyStateStore,
    useFarcasterStateStore,
    useLensStateStore,
    useTwitterStateStore,
} from '@/store/useProfileStore.js';

export function useCurrentProfilesAll() {
    const currentLensProfile = useLensStateStore.use.currentProfile();
    const currentFarcasterProfile = useFarcasterStateStore.use.currentProfile();
    const currentTwitterProfile = useTwitterStateStore.use.currentProfile();
    const currentBskyProfile = useBskyStateStore.use.currentProfile();

    return useMemo<Record<SocialSource, Profile | null>>(
        () => ({
            [Source.Farcaster]: currentFarcasterProfile,
            [Source.Lens]: currentLensProfile,
            [Source.Twitter]: currentTwitterProfile,
            [Source.Bsky]: currentBskyProfile,
        }),
        [currentFarcasterProfile, currentLensProfile, currentTwitterProfile, currentBskyProfile],
    );
}

export function useCurrentProfile(source: SocialSource) {
    const all = useCurrentProfilesAll();
    return all[source];
}

export function useCurrentProfileFirstAvailable() {
    const all = useCurrentProfilesAll();
    return first(compact(SORTED_SOCIAL_SOURCES.map((x) => all[x]))) ?? null;
}

export function useCurrentAvailableProfile(source?: SocialSource) {
    const all = useCurrentProfilesAll();

    return useMemo(() => {
        if (source && all[source]) return all[source];

        const indexOfFirstAvailable = SORTED_SOCIAL_SOURCES.findIndex((x) => !!all[x]);
        return indexOfFirstAvailable === -1 ? null : all[SORTED_SOCIAL_SOURCES[indexOfFirstAvailable]];
    }, [source, all]);
}

export function useCurrentProfiles() {
    const all = useCurrentProfilesAll();
    return useMemo(() => {
        return compact(SORTED_SOCIAL_SOURCES.map((x) => all[x]));
    }, [all]);
}

export function useCurrentProfileIds() {
    const all = useCurrentProfilesAll();
    return useMemo(() => {
        return compact(SORTED_SOCIAL_SOURCES.map((x) => all[x]?.profileId));
    }, [all]);
}
