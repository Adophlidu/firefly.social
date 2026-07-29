import type { LoginFallbackSource, ProfilePageSource } from '@dimensiondev/enums';
import { type LoaderContext, notFound, useLoaderData } from '@dimensiondev/ssr';
import { runInSafeAsync } from '@dimensiondev/utils';
import type { ReactNode } from 'react';

import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { FireflyAccountInfo } from '@/components/Profile/FireflyAccountInfo.js';
import { ProfileContextProvider } from '@/components/Profile/ProfileContext.js';
import { ProfileInfoCard } from '@/components/Profile/ProfileInfoCard.js';
import { ProfileSourceTabs } from '@/components/Profile/ProfileSourceTabs/index.js';
import { SuspendedAccountFallback } from '@/components/SuspendedAccountFallback.js';
import { createProfileJsonLd, serializeJsonLd } from '@/helpers/createProfileJsonLd.js';
import { isRequestedLoginSource } from '@/helpers/isRequestedLoginSource.js';
import { isProfilePageSource } from '@/helpers/isSource.js';
import { resolveSessionHolder } from '@/helpers/resolveSessionHolder.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { getProfilePageData, type ProfilePageData } from '@/providers/firefly/metadata/getProfilePageData.js';
import type { FireflyIdentity, WalletProfile, WalletProfiles } from '@/providers/types/Firefly.js';

/** Renders its own header — suppress the (normal) frame's NavigatorBar. */
export const topnav = () => null;

/**
 * Transition skeleton (instant swap): mirrors the real profile header —
 * tall banner, centered avatar, name, handle chips, bio card with follow
 * button, follower counts and the category tabs.
 */
export function loadingComponent() {
    return (
        <div className="animate-pulse">
            {/* banner + back/action buttons */}
            <div className="relative h-44 bg-line">
                <div className="absolute left-3 top-3 size-9 rounded-xl bg-primaryBottom/60" />
                <div className="absolute right-3 top-3 flex gap-2">
                    <div className="size-9 rounded-xl bg-primaryBottom/60" />
                    <div className="size-9 rounded-xl bg-primaryBottom/60" />
                </div>
            </div>
            {/* centered avatar + name + handle chips */}
            <div className="flex flex-col items-center px-4">
                <div className="-mt-12 size-24 rounded-full border-4 border-primaryBottom bg-line" />
                <div className="mt-2 h-6 w-40 rounded bg-line" />
                <div className="mt-3 flex items-center gap-2">
                    <div className="h-7 w-28 rounded-full bg-line" />
                    <div className="h-7 w-28 rounded-full bg-line" />
                    <div className="h-7 w-28 rounded-full bg-line" />
                    <div className="h-7 w-36 rounded-full bg-line" />
                </div>
            </div>
            {/* bio card */}
            <div className="mx-4 mt-4 rounded-2xl border border-line p-4">
                <div className="flex items-center gap-3">
                    <div className="size-11 shrink-0 rounded-full bg-line" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-2/5 rounded bg-line" />
                        <div className="h-3 w-1/4 rounded bg-line" />
                    </div>
                    <div className="h-9 w-24 rounded-full bg-line" />
                    <div className="size-8 rounded-full bg-line" />
                </div>
                <div className="mt-3 h-3 w-full rounded bg-line" />
                <div className="mt-2 h-3 w-2/3 rounded bg-line" />
                <div className="mt-3 flex items-center gap-4">
                    <div className="h-3 w-16 rounded bg-line" />
                    <div className="h-3 w-16 rounded bg-line" />
                </div>
                <div className="mt-3 h-3 w-4/5 rounded bg-line" />
            </div>
            {/* category tabs */}
            <div className="mt-4 flex gap-8 border-b border-line px-4 pb-3">
                <div className="h-4 w-10 rounded bg-line" />
                <div className="h-4 w-10 rounded bg-line" />
                <div className="h-4 w-10 rounded bg-line" />
                <div className="h-4 w-14 rounded bg-line" />
            </div>
            {/* first post placeholder */}
            <div className="flex gap-3 p-4">
                <div className="size-10 shrink-0 rounded-full bg-line" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/2 rounded bg-line" />
                    <div className="h-3 w-full rounded bg-line" />
                    <div className="h-3 w-2/3 rounded bg-line" />
                </div>
            </div>
        </div>
    );
}

interface ProfileLayoutData {
    source: ProfilePageSource;
    pageData: ProfilePageData;
    /** Computed on the server; the client must render the same branch. */
    sessionless: boolean;
}

export async function loader({ params }: LoaderContext): Promise<ProfileLayoutData> {
    const source = resolveSourceFromUrlNoFallback(params.source!);
    if (!source || !isProfilePageSource(source)) notFound();

    // Any unexpected fetch error renders the 404 page (matching the old Next
    // layout); suspended accounts and sessionless fallbacks are handled
    // inside getProfilePageData.
    const pageData = await runInSafeAsync(() => getProfilePageData(source, params.id!));
    if (!pageData) notFound();

    return {
        source,
        pageData,
        sessionless: isRequestedLoginSource(source) && !resolveSessionHolder(source).session,
    };
}

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

/**
 * Port of the Next profile layout
 * (src/app/[locale]/(normal)/profile/(profile)/[source]/[id]/layout.tsx):
 * profile header card + source tabs around every profile sub-page. The
 * category tabs live in `$category/_layout.tsx`.
 */
export default function ProfileLayout({ children }: { children?: ReactNode }) {
    const { source, pageData, sessionless } = useLoaderData<ProfileLayoutData>('profile/$source/$id/_layout.tsx');
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

    if (sessionless) {
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
                        {children}
                    </>
                )}
            </ProfileContextProvider>
        </>
    );
}
