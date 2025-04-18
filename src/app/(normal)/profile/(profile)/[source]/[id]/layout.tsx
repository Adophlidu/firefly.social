import { NoSSR } from '@/components/NoSSR.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { FireflyAccountInfo } from '@/components/Profile/FireflyAccountInfo.js';
import { WalletProfileProvider } from '@/components/Profile/ProfileContext.js';
import { ProfileInfoCard } from '@/components/Profile/ProfileInfoCard.js';
import { ProfileSourceTabs } from '@/components/Profile/ProfileSourceTabs.js';
import { SuspendedAccountFallback } from '@/components/SuspendedAccountFallback.js';
import { type LoginFallbackSource, SourceInURL } from '@/constants/enum.js';
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
import { setupTwitterSessionForSSR } from '@/helpers/setupTwitterSessionForSSR.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { FireflyProfile } from '@/providers/types/Firefly.js';
import type { NextPageProps } from '@/types/index.js';

interface Props extends NextPageProps<{ id: string; source: SourceInURL }> {}

export default async function Layout(props: Props) {
    await setupLocaleForSSR();
    await setupTwitterSessionForSSR();

    const params = await props.params;

    const source = resolveSourceFromUrlNoFallback(params.source);
    if (!source || !isProfilePageSource(source)) notFound();

    const identity = resolveSpecialProfileIdentity({ source, id: params.id });
    const relatedProfile = await runInSafeAsync(() =>
        FireflyEndpointProvider.getAllPlatformProfileFromFirefly(identity, false),
    );
    if (!relatedProfile) notFound();
    const profiles = formatFireflyProfilesFromWalletProfiles(relatedProfile) as FireflyProfile[];

    if (isRequestedLoginSource(source) && !resolveSessionHolder(source).session) {
        return (
            <>
                <FireflyAccountInfo identity={identity} relatedProfile={relatedProfile} />
                <ProfileSourceTabs profiles={profiles} identity={identity} />
                <NotLoginFallback source={source as LoginFallbackSource} />
            </>
        );
    }

    const { walletProfile } = resolveFireflyProfiles(identity, profiles);
    const socialProfile =
        identity.id && !walletProfile
            ? await resolveSocialMediaProvider(narrowToSocialSource(identity.source))
                  .getProfileByIdOrHandle(identity.id)
                  .catch(() => notFound())
            : null;

    return (
        <>
            <FireflyAccountInfo
                relatedProfile={relatedProfile}
                identity={identity}
                socialProfile={socialProfile}
                walletProfile={walletProfile}
                profiles={profiles}
            />
            <ProfileSourceTabs profiles={profiles} identity={identity} socialProfile={socialProfile} />
            {!socialProfile && !walletProfile ? (
                <SuspendedAccountFallback />
            ) : (
                <WalletProfileProvider profiles={profiles} identity={identity}>
                    <ProfileInfoCard
                        source={source}
                        socialProfile={socialProfile}
                        walletProfile={walletProfile}
                        profiles={profiles}
                    />
                    <NoSSR>{props.children}</NoSSR>
                </WalletProfileProvider>
            )}
        </>
    );
}
