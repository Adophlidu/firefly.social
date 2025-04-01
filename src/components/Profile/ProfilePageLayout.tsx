'use client';

import { useQuery } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';

import { NoSSR } from '@/components/NoSSR.js';
import { FireflyAccountInfo } from '@/components/Profile/FireflyAccountInfo.js';
import { WalletProfileProvider } from '@/components/Profile/ProfileContext.js';
import { ProfileInfoCard } from '@/components/Profile/ProfileInfoCard.js';
import { ProfileSourceTabs } from '@/components/Profile/ProfileSourceTabs.js';
import { SuspendedAccountFallback } from '@/components/SuspendedAccountFallback.js';
import type { ProfilePageSource } from '@/constants/enum.js';
import { formatFireflyProfilesFromWalletProfiles } from '@/helpers/formatFireflyProfilesFromWalletProfiles.js';
import { resolveFireflyProfiles } from '@/helpers/resolveFireflyProfiles.js';
import { useRefreshedProfile } from '@/hooks/useRefreshedProfile.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { FireflyIdentity, FireflyProfile, WalletProfiles } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export function ProfilePageLayout({
    source,
    identity,
    profile,
    children,
    ...rest
}: PropsWithChildren<{
    walletProfiles: WalletProfiles;
    profile?: Profile;
    source: ProfilePageSource;
    identity: FireflyIdentity;
}>) {
    const { data: walletProfiles } = useQuery({
        queryKey: ['wallet-profiles', identity],
        async queryFn() {
            return FireflyEndpointProvider.getAllPlatformProfileFromFirefly(identity, false);
        },
        initialData: rest.walletProfiles,
    });
    const profiles = formatFireflyProfilesFromWalletProfiles(walletProfiles) as FireflyProfile[];
    const { data: socialProfile } = useRefreshedProfile(profile);
    const { walletProfile } = resolveFireflyProfiles(identity, profiles);

    return (
        <>
            <FireflyAccountInfo
                profile={walletProfiles.account}
                identity={identity}
                socialProfile={socialProfile}
                walletProfile={walletProfile ?? undefined}
                profiles={profiles}
            />
            <ProfileSourceTabs profiles={profiles} identity={identity} />
            {!socialProfile && !walletProfile ? (
                <SuspendedAccountFallback />
            ) : (
                <WalletProfileProvider profiles={profiles} identity={identity}>
                    <ProfileInfoCard
                        source={source}
                        socialProfile={socialProfile}
                        walletProfile={walletProfile ?? undefined}
                        profiles={profiles}
                    />
                    <NoSSR>{children}</NoSSR>
                </WalletProfileProvider>
            )}
        </>
    );
}
