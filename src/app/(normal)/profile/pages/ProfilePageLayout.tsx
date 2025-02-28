import { StatusCodes } from 'http-status-codes';
import { uniqBy } from 'lodash-es';
import { type PropsWithChildren } from 'react';

import { NoSSR } from '@/components/NoSSR.js';
import { HackedWarningCard } from '@/components/Profile/HackedWarningCard.js';
import { Info } from '@/components/Profile/Info.js';
import { ProfileNotFound } from '@/components/Profile/ProfileNotFound.js';
import { ProfileSourceTabs } from '@/components/Profile/ProfileSourceTabs.js';
import { ProfileTabs } from '@/components/Profile/ProfileTabs.js';
import { Title } from '@/components/Profile/Title.js';
import { WalletInfo } from '@/components/Profile/WalletInfo.js';
import { ProfileDetailEffect } from '@/components/ProfileDetailEffect.js';
import { SuspendedAccountFallback } from '@/components/SuspendedAccountFallback.js';
import { SuspendedAccountInfo } from '@/components/SuspendedAccountInfo.js';
import { Source } from '@/constants/enum.js';
import { FetchError } from '@/constants/error.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { resolveFireflyProfiles } from '@/helpers/resolveFireflyProfiles.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import type { FireflyIdentity, FireflyProfile } from '@/providers/types/Firefly.js';

export async function ProfilePageLayout({
    identity,
    children,
    profiles,
}: PropsWithChildren<{ identity: FireflyIdentity; profiles: FireflyProfile[] }>) {
    const resolvedSource = narrowToSocialSource(identity.source);
    const { walletProfile } = resolveFireflyProfiles(identity, profiles);

    try {
        const profile =
            identity.id && identity.source !== Source.Wallet
                ? await runInSafeAsync(() =>
                      resolveSocialMediaProvider(resolvedSource).getProfileByIdOrHandle(identity.id),
                  )
                : null;
        if (!profile && !walletProfile && !profiles.length) return <ProfileNotFound />;

        return (
            <>
                <ProfileSourceTabs
                    profiles={uniqBy(profiles, (x) => `${x.identity.source}_${x.identity.id}`)}
                    identity={identity}
                />
                {profile || walletProfile ? (
                    <Title
                        profile={profile}
                        profiles={profiles}
                        fallbackIdentity={identity}
                        fallbackWalletProfile={walletProfile}
                    />
                ) : null}
                {identity.source === Source.Wallet && walletProfile ? (
                    <WalletInfo profile={walletProfile} />
                ) : profile ? (
                    <Info profile={profile} />
                ) : profiles.length ? (
                    <SuspendedAccountInfo source={resolvedSource} />
                ) : null}
                <ProfileTabs profiles={profiles} identity={identity} />
                {identity.source === Source.Wallet && walletProfile?.hacked ? <HackedWarningCard /> : null}
                <NoSSR>{children}</NoSSR>
                <ProfileDetailEffect profile={profile} identity={identity} walletProfile={walletProfile} />
            </>
        );
    } catch (error) {
        if (error instanceof FetchError && error.status === StatusCodes.FORBIDDEN) {
            return (
                <>
                    <SuspendedAccountInfo source={resolvedSource} />
                    <SuspendedAccountFallback />
                </>
            );
        }

        throw error;
    }
}
