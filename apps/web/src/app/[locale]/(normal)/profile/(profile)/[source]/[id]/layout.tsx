import type { LoginFallbackSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';
import { createIndicator, type Pageable, type PageIndicator, runInSafeAsync } from '@dimensiondev/utils';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { FireflyAccountInfo } from '@/components/Profile/FireflyAccountInfo.js';
import { ProfileContextProvider } from '@/components/Profile/ProfileContext.js';
import { ProfileInfoCard } from '@/components/Profile/ProfileInfoCard.js';
import { ProfileSourceTabs } from '@/components/Profile/ProfileSourceTabs/index.js';
import { SuspendedAccountFallback } from '@/components/SuspendedAccountFallback.js';
import { AccountSuspendedError } from '@/constants/error.js';
import { notFound } from '@/esm/navigation/server.js';
import { createProfileJsonLd, serializeJsonLd } from '@/helpers/createProfileJsonLd.js';
import { formatFireflyProfilesFromWalletProfiles } from '@/helpers/formatFireflyProfilesFromWalletProfiles.js';
import { isRequestedLoginSource } from '@/helpers/isRequestedLoginSource.js';
import { isProfilePageSource } from '@/helpers/isSource.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { resolveFireflyProfiles } from '@/helpers/resolveFireflyProfiles.js';
import { resolveSessionHolder } from '@/helpers/resolveSessionHolder.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { resolveSpecialProfileIdentity } from '@/helpers/resolveSpecialProfileIdentity.js';
import type { FireflyIdentity, FireflyProfile } from '@/providers/types/Firefly.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { getAllRelatedProfilesWithDefault } from '@/services/getAllRelatedProfilesWithDefault.js';

export const revalidate = 60;

interface Props extends LayoutProps<{ id: string; source: string }> {}

// Now we only support profile handle in url, so we fix the identity here
function fixIdentity(identity: FireflyIdentity, profiles: FireflyProfile[]) {
    if (identity.source === Source.Farcaster || identity.source === Source.Twitter) {
        const profile = profiles.find((p) => p.identity.source === identity.source && p.displayName === identity.id);
        return profile?.identity || identity;
    }
    return identity;
}

export default async function Layout(props: Props) {
    const params = await props.params;

    const source = resolveSourceFromUrlNoFallback(params.source);
    if (!source || !isProfilePageSource(source)) notFound();

    // fid handling moved to client-side (useSearchParams) to enable ISR
    const id = params.id;

    const identityFromUrl = resolveSpecialProfileIdentity({ source, id });
    const relatedProfile = await runInSafeAsync(() => getAllRelatedProfilesWithDefault(identityFromUrl));
    if (!relatedProfile) notFound();
    const profiles = formatFireflyProfilesFromWalletProfiles(relatedProfile) as FireflyProfile[];
    const identity = fixIdentity(identityFromUrl, profiles);

    const queryClient = new QueryClient();
    queryClient.setQueryData(['firefly-profile', identityFromUrl.source, identityFromUrl.id], relatedProfile);

    if (isRequestedLoginSource(source) && !resolveSessionHolder(source).session) {
        // The viewer isn't logged in, but the profile itself is public: on the server the
        // provider resolves to the session-free nitter proxy, so fetch it anonymously to keep
        // profile text and JSON-LD in the SSR HTML. On failure, degrade to the plain fallback.
        const socialProfile = identityFromUrl.id
            ? ((await runInSafeAsync(() =>
                  resolveSocialMediaProvider(narrowToSocialSource(identity.source)).getProfileByHandle(
                      identityFromUrl.id,
                      true,
                  ),
              )) ?? null)
            : null;

        if (socialProfile) {
            queryClient.setQueryData(['profile', socialProfile.source, socialProfile.profileId], socialProfile);
            queryClient.setQueryData(['profile', socialProfile.source, socialProfile.handle], socialProfile);
            queryClient.setQueryData(['profile', socialProfile.source, id], socialProfile);
            queryClient.setQueryData(
                ['firefly-profile', socialProfile.source, socialProfile.profileId],
                relatedProfile,
            );
            queryClient.setQueryData(['firefly-profile', socialProfile.source, socialProfile.handle], relatedProfile);
        }

        return (
            <HydrationBoundary state={dehydrate(queryClient)}>
                {/* eslint-disable react/no-danger -- JSON-LD is serialized with `<` escaped */}
                {socialProfile ? (
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{ __html: serializeJsonLd(createProfileJsonLd(socialProfile)) }}
                    />
                ) : null}
                {/* eslint-enable react/no-danger */}
                <FireflyAccountInfo identity={identity} relatedProfile={relatedProfile} socialProfile={socialProfile} />
                <ProfileSourceTabs
                    profiles={profiles}
                    identity={identity}
                    socialProfile={socialProfile}
                    identityFromUrl={identityFromUrl}
                />
                {socialProfile ? (
                    <ProfileContextProvider profiles={profiles} identity={identity} socialProfile={socialProfile}>
                        <ProfileInfoCard
                            source={source}
                            socialProfile={socialProfile}
                            profiles={profiles}
                            hasFireflyAccount={!!relatedProfile.account}
                        />
                    </ProfileContextProvider>
                ) : null}
                <NotLoginFallback source={source as LoginFallbackSource} />
            </HydrationBoundary>
        );
    }

    const { walletProfile } = resolveFireflyProfiles(identity, profiles);
    try {
        const socialProfile =
            identityFromUrl.id && !walletProfile
                ? await resolveSocialMediaProvider(narrowToSocialSource(identity.source)).getProfileByHandle(
                      identityFromUrl.id,
                      true,
                  )
                : null;

        if (socialProfile) {
            queryClient.setQueryData(['profile', socialProfile.source, socialProfile.profileId], socialProfile);
            queryClient.setQueryData(['profile', socialProfile.source, socialProfile.handle], socialProfile);
            // Also key by the raw URL id: the client page resolves the profile with
            // `['profile', source, params.id]`, which can differ in case/normalization from
            // `socialProfile.handle` (e.g. Lens). Seeding it too keeps the client profile
            // query hydrated so FeedList derives the same profileId the prefetch used.
            queryClient.setQueryData(['profile', socialProfile.source, id], socialProfile);
            queryClient.setQueryData(
                ['firefly-profile', socialProfile.source, socialProfile.profileId],
                relatedProfile,
            );
            queryClient.setQueryData(['firefly-profile', socialProfile.source, socialProfile.handle], relatedProfile);

            // Anonymously prefetch the first page of the Feed timeline so it ships in the
            // initial HTML (ISR-cached, crawlable) instead of being a client-only shell.
            // Relationship fields (hasLiked, …) stay empty here and are filled in by the
            // client refetch once the viewer's session is available. Twitter is excluded:
            // its timeline goes through an in-app /api route that needs the viewer's token.
            if (socialProfile.source !== Source.Twitter) {
                await runInSafeAsync(() =>
                    queryClient.prefetchInfiniteQuery({
                        queryKey: ['posts', socialProfile.source, 'posts-of', socialProfile.profileId, false],
                        queryFn: ({ pageParam }) =>
                            resolveSocialMediaProvider(socialProfile.source).getPostsByProfileId(
                                socialProfile.profileId,
                                createIndicator(undefined, pageParam as string),
                            ),
                        initialPageParam: '',
                        getNextPageParam: (lastPage: Pageable<Post, PageIndicator>) => {
                            if (lastPage?.data.length === 0) return;
                            return lastPage?.nextIndicator?.id;
                        },
                    }),
                );
            }
        }

        return (
            <HydrationBoundary state={dehydrate(queryClient)}>
                {/* eslint-disable react/no-danger -- JSON-LD is serialized with `<` escaped */}
                {socialProfile ? (
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{ __html: serializeJsonLd(createProfileJsonLd(socialProfile)) }}
                    />
                ) : null}
                {/* eslint-enable react/no-danger */}
                <ProfileContextProvider profiles={profiles} identity={identity} socialProfile={socialProfile}>
                    <FireflyAccountInfo
                        relatedProfile={relatedProfile}
                        identity={identity}
                        socialProfile={socialProfile}
                        walletProfile={walletProfile}
                    />
                    <ProfileSourceTabs
                        profiles={profiles}
                        identity={identity}
                        socialProfile={socialProfile}
                        identityFromUrl={identityFromUrl}
                    />
                    {!socialProfile && !walletProfile ? (
                        <SuspendedAccountFallback />
                    ) : (
                        <>
                            <ProfileInfoCard
                                source={source}
                                socialProfile={socialProfile}
                                walletProfile={walletProfile}
                                profiles={profiles}
                                hasFireflyAccount={!!relatedProfile.account}
                            />
                            {props.children}
                        </>
                    )}
                </ProfileContextProvider>
            </HydrationBoundary>
        );
    } catch (error) {
        if (error instanceof AccountSuspendedError) {
            return (
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <FireflyAccountInfo
                        relatedProfile={relatedProfile}
                        identity={identity}
                        walletProfile={walletProfile}
                    />
                    <ProfileSourceTabs profiles={profiles} identity={identity} identityFromUrl={identityFromUrl} />
                    <SuspendedAccountFallback />
                </HydrationBoundary>
            );
        }
        notFound();
    }
}
