import type { ProfilePageSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { createIndicator, type Pageable, type PageIndicator, runInSafeAsync } from '@dimensiondev/utils';
import type { InfiniteData } from '@tanstack/react-query';
import { cache } from 'react';

import { AccountSuspendedError } from '@/constants/error.js';
import { buildProfileFeedInitialData } from '@/helpers/buildProfileFeedInitialData.js';
import { formatFireflyProfilesFromWalletProfiles } from '@/helpers/formatFireflyProfilesFromWalletProfiles.js';
import { getSocialProfileByHandlePageData } from '@/helpers/getSocialProfilePageData.js';
import { isRequestedLoginSource } from '@/helpers/isRequestedLoginSource.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { resolveFireflyProfiles } from '@/helpers/resolveFireflyProfiles.js';
import { resolveSessionHolder } from '@/helpers/resolveSessionHolder.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSpecialProfileIdentity } from '@/helpers/resolveSpecialProfileIdentity.js';
import type { FireflyIdentity, FireflyProfile, WalletProfile } from '@/providers/types/Firefly.js';
import type { Post, Profile } from '@/providers/types/SocialMedia.js';
import { getAllRelatedProfilesWithDefault } from '@/services/getAllRelatedProfilesWithDefault.js';

export type ProfileFeedInitialData = InfiniteData<Pageable<Post, PageIndicator>, string>;

export interface ProfilePageData {
    relatedProfile: NonNullable<Awaited<ReturnType<typeof getAllRelatedProfilesWithDefault>>>;
    profiles: FireflyProfile[];
    identity: FireflyIdentity;
    identityFromUrl: FireflyIdentity;
    socialProfile: Profile | null;
    walletProfile: WalletProfile | null;
    initialFeedPage?: ProfileFeedInitialData;
    accountSuspended: boolean;
}

function fixIdentity(identity: FireflyIdentity, profiles: FireflyProfile[]) {
    if (identity.source === Source.Farcaster || identity.source === Source.Twitter) {
        const profile = profiles.find((p) => p.identity.source === identity.source && p.displayName === identity.id);
        return profile?.identity || identity;
    }
    return identity;
}

// react `cache()` memoizes by argument identity, so keep the arguments primitive: the layout
// and generateMetadata must land on the same cache entry to share one fetch per request.
export const getProfilePageData = cache(
    async (source: ProfilePageSource, urlId: string): Promise<ProfilePageData | null> => {
        // Anonymous views of login-required sources degrade gracefully: profile fetch errors
        // fall back to the NotLoginFallback UI and the feed is not prefetched.
        const sessionless = isRequestedLoginSource(source) && !resolveSessionHolder(source).session;
        const identityFromUrl = resolveSpecialProfileIdentity({ source, id: urlId });
        const relatedProfile = await runInSafeAsync(() => getAllRelatedProfilesWithDefault(identityFromUrl));
        if (!relatedProfile) return null;

        const profiles = formatFireflyProfilesFromWalletProfiles(relatedProfile) as FireflyProfile[];
        const identity = fixIdentity(identityFromUrl, profiles);
        const { walletProfile } = resolveFireflyProfiles(identity, profiles);

        let socialProfile: Profile | null = null;
        let initialFeedPage: ProfileFeedInitialData | undefined;
        let accountSuspended = false;

        if (identityFromUrl.id && !walletProfile) {
            try {
                socialProfile = await getSocialProfileByHandlePageData(
                    narrowToSocialSource(identity.source),
                    identityFromUrl.id,
                );

                if (socialProfile && !sessionless && socialProfile.source !== Source.Twitter) {
                    const page = await runInSafeAsync(() =>
                        resolveSocialMediaProvider(socialProfile!.source).getPostsByProfileId(
                            socialProfile!.profileId,
                            createIndicator(undefined, ''),
                        ),
                    );
                    if (page?.data.length) {
                        initialFeedPage = buildProfileFeedInitialData(page);
                    }
                }
            } catch (error) {
                if (error instanceof AccountSuspendedError) {
                    accountSuspended = true;
                } else if (sessionless) {
                    // No session to retry with — render the public shell + NotLoginFallback.
                    socialProfile = null;
                } else {
                    throw error;
                }
            }
        }

        return {
            relatedProfile,
            profiles,
            identity,
            identityFromUrl,
            socialProfile: socialProfile,
            walletProfile,
            initialFeedPage,
            accountSuspended,
        };
    },
);
