import { useMemo } from 'react';

import { type SocialSource, Source } from '@/constants/enum.js';
import {
    useBskyStateStore,
    useFarcasterStateStore,
    useLensStateStore,
    useTwitterStateStore,
} from '@/store/useProfileStore.js';

export function useProfileStoreAll() {
    const lensStatus = useLensStateStore.use.status();
    const lensAccounts = useLensStateStore.use.accounts();
    const currentLensProfile = useLensStateStore.use.currentProfile();
    const currentLensProfileSession = useLensStateStore.use.currentProfileSession();

    const farcasterStatus = useFarcasterStateStore.use.status();
    const farcasterAccounts = useFarcasterStateStore.use.accounts();
    const currentFarcasterProfile = useFarcasterStateStore.use.currentProfile();
    const currentFarcasterProfileSession = useFarcasterStateStore.use.currentProfileSession();

    const twitterStatus = useTwitterStateStore.use.status();
    const twitterAccounts = useTwitterStateStore.use.accounts();
    const currentTwitterProfile = useTwitterStateStore.use.currentProfile();
    const currentTwitterProfileSession = useTwitterStateStore.use.currentProfileSession();

    const bskyStatus = useBskyStateStore.use.status();
    const bskyAccounts = useBskyStateStore.use.accounts();
    const currentBskyProfile = useBskyStateStore.use.currentProfile();
    const currentBskyProfileSession = useBskyStateStore.use.currentProfileSession();

    return useMemo(() => {
        const store = {
            [Source.Farcaster]: {
                status: farcasterStatus,
                currentProfile: currentFarcasterProfile,
                currentProfileSession: currentFarcasterProfileSession,
                accounts: farcasterAccounts,
                profiles: farcasterAccounts.map((x) => x.profile),
            },
            [Source.Lens]: {
                status: lensStatus,
                currentProfile: currentLensProfile,
                currentProfileSession: currentLensProfileSession,
                accounts: lensAccounts,
                profiles: lensAccounts.map((x) => x.profile),
            },
            [Source.Twitter]: {
                status: twitterStatus,
                currentProfile: currentTwitterProfile,
                currentProfileSession: currentTwitterProfileSession,
                accounts: twitterAccounts,
                profiles: twitterAccounts.map((x) => x.profile),
            },
            [Source.Bsky]: {
                status: bskyStatus,
                currentProfile: currentBskyProfile,
                currentProfileSession: currentBskyProfileSession,
                accounts: bskyAccounts,
                profiles: bskyAccounts.map((x) => x.profile),
            },
        };
        return store as Record<SocialSource, (typeof store)[SocialSource]>;
    }, [
        // farcaster
        farcasterStatus,
        currentFarcasterProfile,
        currentFarcasterProfileSession,
        farcasterAccounts,

        // lens
        lensStatus,
        currentLensProfile,
        currentLensProfileSession,
        lensAccounts,

        // twitter
        twitterStatus,
        currentTwitterProfile,
        currentTwitterProfileSession,
        twitterAccounts,

        // bluesky
        bskyStatus,
        currentBskyProfile,
        currentBskyProfileSession,
        bskyAccounts,
    ]);
}

export function useProfileStore(source: SocialSource) {
    const all = useProfileStoreAll();
    return all[source];
}
