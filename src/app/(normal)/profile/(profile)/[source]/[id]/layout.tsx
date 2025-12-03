import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { NoSSR } from '@/components/NoSSR.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { FireflyAccountInfo } from '@/components/Profile/FireflyAccountInfo.js';
import { ProfileContextProvider } from '@/components/Profile/ProfileContext.js';
import { ProfileInfoCard } from '@/components/Profile/ProfileInfoCard.js';
import { ProfileSourceTabs } from '@/components/Profile/ProfileSourceTabs.js';
import { SuspendedAccountFallback } from '@/components/SuspendedAccountFallback.js';
import { type LoginFallbackSource, type ProfilePageSourceInURL, Source } from '@/constants/enum.js';
import { AccountSuspendedError } from '@/constants/error.js';
import { notFound } from '@/esm/navigation/server.js';
import { formatFireflyProfilesFromWalletProfiles } from '@/helpers/formatFireflyProfilesFromWalletProfiles.js';
import { isRequestedLoginSource } from '@/helpers/isRequestedLoginSource.js';
import { isProfilePageSource } from '@/helpers/isSource.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { resolveFireflyProfiles } from '@/helpers/resolveFireflyProfiles.js';
import { resolveSessionHolder } from '@/helpers/resolveSessionHolder.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { resolveSpecialProfileIdentity } from '@/helpers/resolveSpecialProfileIdentity.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import type { FireflyIdentity, FireflyProfile } from '@/providers/types/Firefly.js';
import { getAllRelatedProfilesWithDefault } from '@/services/getAllRelatedProfilesWithDefault.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props extends NextPageProps<{ id: string; source: ProfilePageSourceInURL }> {}

// Now we only support profile handle in url, so we fix the identity here
function fixIdentity(identity: FireflyIdentity, profiles: FireflyProfile[]) {
    switch (identity.source) {
        case Source.Farcaster:
        case Source.Twitter:
            const profile = profiles.find(
                (p) => p.identity.source === identity.source && p.displayName === identity.id,
            );
            return profile?.identity || identity;
        default:
            return identity;
    }
}

export default async function Layout(props: Props) {
    await setupLocaleForSSR();

    const params = await props.params;

    const source = resolveSourceFromUrlNoFallback(params.source);
    if (!source || !isProfilePageSource(source)) notFound();

    const identityFromUrl = resolveSpecialProfileIdentity({ source, id: params.id });
    const relatedProfile = await runInSafeAsync(() => getAllRelatedProfilesWithDefault(identityFromUrl));
    if (!relatedProfile) notFound();
    const profiles = formatFireflyProfilesFromWalletProfiles(relatedProfile) as FireflyProfile[];
    const identity = fixIdentity(identityFromUrl, profiles);

    const queryClient = new QueryClient();
    queryClient.setQueryData(['firefly-profile', identityFromUrl.source, identityFromUrl.id], relatedProfile);

    if (isRequestedLoginSource(source) && !resolveSessionHolder(source).session) {
        return (
            <HydrationBoundary state={dehydrate(queryClient)}>
                <FireflyAccountInfo identity={identity} relatedProfile={relatedProfile} />
                <ProfileSourceTabs profiles={profiles} identity={identity} identityFromUrl={identityFromUrl} />
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
            queryClient.setQueryData(
                ['firefly-profile', socialProfile.source, socialProfile.profileId],
                relatedProfile,
            );
            queryClient.setQueryData(['firefly-profile', socialProfile.source, socialProfile.handle], relatedProfile);
        }

        return (
            <HydrationBoundary state={dehydrate(queryClient)}>
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
                            />
                            <NoSSR>{props.children}</NoSSR>
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
