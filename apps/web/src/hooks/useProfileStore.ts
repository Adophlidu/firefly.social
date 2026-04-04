import { useMemo } from 'react';

import { type ProfileSource, Source } from '@/constants/enum.js';
import { useBskyProfileStore } from '@/store/useProfileStore/useBskyProfileStore.js';
import { useFarcasterProfileStore } from '@/store/useProfileStore/useFarcasterProfileStore.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';
import { useLensProfileStore } from '@/store/useProfileStore/useLensProfileStore.js';
import { useThirdPartyProfileStore } from '@/store/useProfileStore/useThirdPartyProfileStore.js';
import { useTwitterProfileStore } from '@/store/useProfileStore/useTwitterProfileStore.js';

export function useProfileStoreAll() {
    const fireflyStatus = useFireflyProfileStore.use.status();
    const fireflyAccounts = useFireflyProfileStore.use.accounts();
    const currentFireflyProfile = useFireflyProfileStore.use.currentProfile();
    const currentFireflyProfileSession = useFireflyProfileStore.use.currentProfileSession();
    const clearFirefly = useFireflyProfileStore.use.clear();

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

    const thirdPartyStatus = useThirdPartyProfileStore.use.status();
    const thirdPartyAccounts = useThirdPartyProfileStore.use.accounts();
    const currentThirdPartyProfile = useThirdPartyProfileStore.use.currentProfile();
    const currentThirdPartyProfileSession = useThirdPartyProfileStore.use.currentProfileSession();
    const clearThirdParty = useThirdPartyProfileStore.use.clear();

    return useMemo(() => {
        const store = {
            [Source.Firefly]: {
                status: fireflyStatus,
                currentProfile: currentFireflyProfile,
                currentProfileSession: currentFireflyProfileSession,
                accounts: fireflyAccounts,
                profiles: fireflyAccounts.map((x) => x.profile),
                clear: clearFirefly,
            },
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
            [Source.Google]: {
                status: thirdPartyStatus,
                currentProfile: currentThirdPartyProfile,
                currentProfileSession: currentThirdPartyProfileSession,
                accounts: thirdPartyAccounts,
                profiles: thirdPartyAccounts.map((x) => x.profile),
                clear: clearThirdParty,
            },
            [Source.Telegram]: {
                status: thirdPartyStatus,
                currentProfile: currentThirdPartyProfile,
                currentProfileSession: currentThirdPartyProfileSession,
                accounts: thirdPartyAccounts,
                profiles: thirdPartyAccounts.map((x) => x.profile),
                clear: clearThirdParty,
            },
            [Source.Email]: {
                status: thirdPartyStatus,
                currentProfile: currentThirdPartyProfile,
                currentProfileSession: currentThirdPartyProfileSession,
                accounts: thirdPartyAccounts,
                profiles: thirdPartyAccounts.map((x) => x.profile),
                clear: clearThirdParty,
            },
            [Source.Apple]: {
                status: thirdPartyStatus,
                currentProfile: currentThirdPartyProfile,
                currentProfileSession: currentThirdPartyProfileSession,
                accounts: thirdPartyAccounts,
                profiles: thirdPartyAccounts.map((x) => x.profile),
                clear: clearThirdParty,
            },
        };
        return store as Record<ProfileSource, (typeof store)[ProfileSource]>;
    }, [
        // firefly
        fireflyStatus,
        currentFireflyProfile,
        currentFireflyProfileSession,
        fireflyAccounts,
        clearFirefly,

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

        // third party
        thirdPartyStatus,
        currentThirdPartyProfile,
        currentThirdPartyProfileSession,
        thirdPartyAccounts,
        clearThirdParty,
    ]);
}

export function useProfileStore(source: ProfileSource) {
    const all = useProfileStoreAll();
    return all[source];
}
