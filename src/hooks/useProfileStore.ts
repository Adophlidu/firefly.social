import { useMemo } from 'react';

import { type SocialSource, Source } from '@/constants/enum.js';
import { useBskyProfileStore } from '@/store/useProfileStore/useBskyProfileStore.js';
import { useFarcasterProfileStore } from '@/store/useProfileStore/useFarcasterProfileStore.js';
import { useLensProfileStore } from '@/store/useProfileStore/useLensProfileStore.js';
import { useTwitterProfileStore } from '@/store/useProfileStore/useTwitterProfileStore.js';

export function useProfileStoreAll() {
    const lensStatus = useLensProfileStore.use.status();
    const lensAccounts = useLensProfileStore.use.accounts();
    const currentLensProfile = useLensProfileStore.use.currentProfile();
    const currentLensProfileSession = useLensProfileStore.use.currentProfileSession();
    const clearLens = useLensProfileStore.use.clear();

    const farcasterStatus = useFarcasterProfileStore.use.status();
    const farcasterAccounts = useFarcasterProfileStore.use.accounts();
    const currentFarcasterProfile = useFarcasterProfileStore.use.currentProfile();
    const currentFarcasterProfileSession = useFarcasterProfileStore.use.currentProfileSession();
    const clearFarcaster = useFarcasterProfileStore.use.clear();

    const twitterStatus = useTwitterProfileStore.use.status();
    const twitterAccounts = useTwitterProfileStore.use.accounts();
    const currentTwitterProfile = useTwitterProfileStore.use.currentProfile();
    const currentTwitterProfileSession = useTwitterProfileStore.use.currentProfileSession();
    const clearTwitter = useTwitterProfileStore.use.clear();

    const bskyStatus = useBskyProfileStore.use.status();
    const bskyAccounts = useBskyProfileStore.use.accounts();
    const currentBskyProfile = useBskyProfileStore.use.currentProfile();
    const currentBskyProfileSession = useBskyProfileStore.use.currentProfileSession();
    const clearBsky = useBskyProfileStore.use.clear();

    return useMemo(() => {
        const store = {
            [Source.Farcaster]: {
                status: farcasterStatus,
                currentProfile: currentFarcasterProfile,
                currentProfileSession: currentFarcasterProfileSession,
                accounts: farcasterAccounts,
                profiles: farcasterAccounts.map((x) => x.profile),
                clear: clearFarcaster,
            },
            [Source.Lens]: {
                status: lensStatus,
                currentProfile: currentLensProfile,
                currentProfileSession: currentLensProfileSession,
                accounts: lensAccounts,
                profiles: lensAccounts.map((x) => x.profile),
                clear: clearLens,
            },
            [Source.Twitter]: {
                status: twitterStatus,
                currentProfile: currentTwitterProfile,
                currentProfileSession: currentTwitterProfileSession,
                accounts: twitterAccounts,
                profiles: twitterAccounts.map((x) => x.profile),
                clear: clearTwitter,
            },
            [Source.Bsky]: {
                status: bskyStatus,
                currentProfile: currentBskyProfile,
                currentProfileSession: currentBskyProfileSession,
                accounts: bskyAccounts,
                profiles: bskyAccounts.map((x) => x.profile),
                clear: clearBsky,
            },
        };
        return store as Record<SocialSource, (typeof store)[SocialSource]>;
    }, [
        // farcaster
        farcasterStatus,
        currentFarcasterProfile,
        currentFarcasterProfileSession,
        farcasterAccounts,
        clearFarcaster,

        // lens
        lensStatus,
        currentLensProfile,
        currentLensProfileSession,
        lensAccounts,
        clearLens,

        // twitter
        twitterStatus,
        currentTwitterProfile,
        currentTwitterProfileSession,
        twitterAccounts,
        clearTwitter,

        // bluesky
        bskyStatus,
        currentBskyProfile,
        currentBskyProfileSession,
        bskyAccounts,
        clearBsky,
    ]);
}

export function useProfileStore(source: SocialSource) {
    const all = useProfileStoreAll();
    return all[source];
}
