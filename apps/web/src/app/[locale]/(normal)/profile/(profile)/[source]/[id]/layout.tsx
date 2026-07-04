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

export const revalidate = 60;

interface Props extends LayoutProps<{ id: string; source: string }> {}

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

    if (isRequestedLoginSource(source) && !resolveSessionHolder(source).session) {
        return (
            <>
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
                    <ProfileContextProvider
                        profiles={profiles}
                        identity={identity}
                        socialProfile={socialProfile}
                        initialFeedPage={initialFeedPage}
                    >
                        <ProfileInfoCard
                            source={source}
                            socialProfile={socialProfile}
                            profiles={profiles}
                            hasFireflyAccount={!!relatedProfile.account}
                        />
                    </ProfileContextProvider>
                ) : null}
                <NotLoginFallback source={source as LoginFallbackSource} />
            </>
        );
    }

    if (accountSuspended) {
        return (
            <>
                <FireflyAccountInfo relatedProfile={relatedProfile} identity={identity} walletProfile={walletProfile} />
                <ProfileSourceTabs profiles={profiles} identity={identity} identityFromUrl={identityFromUrl} />
                <SuspendedAccountFallback />
            </>
        );
    }

    return (
        <>
            {/* eslint-disable react/no-danger -- JSON-LD is serialized with `<` escaped */}
            {socialProfile ? (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: serializeJsonLd(createProfileJsonLd(socialProfile)) }}
                />
            ) : null}
            {/* eslint-enable react/no-danger */}
            <ProfileContextProvider
                profiles={profiles}
                identity={identity}
                socialProfile={socialProfile}
                initialFeedPage={initialFeedPage}
            >
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
        </>
    );
}
