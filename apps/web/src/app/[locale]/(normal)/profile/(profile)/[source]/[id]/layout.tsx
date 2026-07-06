import type { LoginFallbackSource } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';
import { runInSafeAsync } from '@dimensiondev/utils';

import { getProfilePageData } from '@/app/[locale]/(normal)/profile/(profile)/[source]/[id]/getProfilePageData.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { FireflyAccountInfo } from '@/components/Profile/FireflyAccountInfo.js';
import { ProfileContextProvider } from '@/components/Profile/ProfileContext.js';
import { ProfileInfoCard } from '@/components/Profile/ProfileInfoCard.js';
import { ProfileSourceTabs } from '@/components/Profile/ProfileSourceTabs/index.js';
import { SuspendedAccountFallback } from '@/components/SuspendedAccountFallback.js';
import { notFound } from '@/esm/navigation/server.js';
import { createProfileJsonLd, serializeJsonLd } from '@/helpers/createProfileJsonLd.js';
import { isRequestedLoginSource } from '@/helpers/isRequestedLoginSource.js';
import { isProfilePageSource } from '@/helpers/isSource.js';
import { resolveSessionHolder } from '@/helpers/resolveSessionHolder.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import type { FireflyIdentity, WalletProfile, WalletProfiles } from '@/providers/types/Firefly.js';

export const revalidate = 60;

interface Props extends LayoutProps<{ id: string; source: string }> {}

interface ProfileHeaderProps {
    identity: FireflyIdentity;
    identityFromUrl: FireflyIdentity;
    relatedProfile: WalletProfiles;
    walletProfile?: WalletProfile | null;
}

function ProfileHeader({ identity, identityFromUrl, relatedProfile, walletProfile }: ProfileHeaderProps) {
    return (
        <>
            <FireflyAccountInfo relatedProfile={relatedProfile} identity={identity} walletProfile={walletProfile} />
            <ProfileSourceTabs identity={identity} identityFromUrl={identityFromUrl} />
        </>
    );
}

export default async function Layout(props: Props) {
    const params = await props.params;

    const source = resolveSourceFromUrlNoFallback(params.source);
    if (!source || !isProfilePageSource(source)) notFound();

    const id = params.id;
    // Any unexpected fetch error renders the 404 page (matching the pre-refactor behavior);
    // suspended accounts and sessionless fallbacks are handled inside getProfilePageData.
    const pageData = await runInSafeAsync(() => getProfilePageData(source, id));
    if (!pageData) notFound();

    const {
        relatedProfile,
        profiles,
        identity,
        identityFromUrl,
        socialProfile,
        walletProfile,
        initialFeedPage,
        accountSuspended,
    } = pageData;

    const jsonLd = socialProfile ? (
        <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger -- JSON-LD is serialized with `<` escaped
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(createProfileJsonLd(socialProfile)) }}
        />
    ) : null;

    if (isRequestedLoginSource(source) && !resolveSessionHolder(source).session) {
        return (
            <>
                {jsonLd}
                <ProfileContextProvider
                    profiles={profiles}
                    identity={identity}
                    socialProfile={socialProfile}
                    initialFeedPage={initialFeedPage}
                >
                    <ProfileHeader
                        identity={identity}
                        identityFromUrl={identityFromUrl}
                        relatedProfile={relatedProfile}
                    />
                    {socialProfile ? (
                        <ProfileInfoCard source={source} hasFireflyAccount={!!relatedProfile.account} />
                    ) : null}
                </ProfileContextProvider>
                <NotLoginFallback source={source as LoginFallbackSource} />
            </>
        );
    }

    if (accountSuspended) {
        return (
            <ProfileContextProvider profiles={profiles} identity={identity} socialProfile={null}>
                <ProfileHeader
                    identity={identity}
                    identityFromUrl={identityFromUrl}
                    relatedProfile={relatedProfile}
                    walletProfile={walletProfile}
                />
                <SuspendedAccountFallback />
            </ProfileContextProvider>
        );
    }

    return (
        <>
            {jsonLd}
            <ProfileContextProvider
                profiles={profiles}
                identity={identity}
                socialProfile={socialProfile}
                initialFeedPage={initialFeedPage}
            >
                <ProfileHeader
                    identity={identity}
                    identityFromUrl={identityFromUrl}
                    relatedProfile={relatedProfile}
                    walletProfile={walletProfile}
                />
                {!socialProfile && !walletProfile ? (
                    <SuspendedAccountFallback />
                ) : (
                    <>
                        <ProfileInfoCard
                            source={source}
                            walletProfile={walletProfile}
                            hasFireflyAccount={!!relatedProfile.account}
                        />
                        {props.children}
                    </>
                )}
            </ProfileContextProvider>
        </>
    );
}
