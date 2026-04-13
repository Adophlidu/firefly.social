'use client';

import { envs, STATUS } from '@dimensiondev/envs';
import { classNames } from '@dimensiondev/utils';
import { Menu, MenuItems } from '@headlessui/react';
import { useQuery } from '@tanstack/react-query';
import { first } from 'lodash-es';

import { ProfileMenuItem, TopProfileMenuItem } from '@/components/Profile/ProfileSourceTabs/ProfileMenuItems.js';
import { ProfileSourceTabsContainer } from '@/components/Profile/ProfileSourceTabs/ProfileSourceTabsContainer.js';
import { TriggerButton } from '@/components/Profile/ProfileSourceTabs/TriggerButton.js';
import { useSortFireflyProfiles } from '@/components/Profile/ProfileSourceTabs/useSortFireflyProfiles.js';
import { SORTED_PROFILE_SOURCES } from '@/constants/computed.js';
import { type ProfilePageSource, Source } from '@/constants/enum.js';
import { formatFireflyProfilesFromWalletProfiles } from '@/helpers/formatFireflyProfilesFromWalletProfiles.js';
import { isSameFireflyIdentity } from '@/helpers/isSameFireflyIdentity.js';
import { useIsMyRelatedProfile } from '@/hooks/useIsMyRelatedProfile.js';
import type { FireflyIdentity, FireflyProfile } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { getAllRelatedProfilesWithDefault } from '@/services/getAllRelatedProfilesWithDefault.js';

export function ProfileSourceTabs({
    profiles: initialProfiles,
    identity,
    socialProfile,
    identityFromUrl,
}: {
    profiles: FireflyProfile[];
    identity: FireflyIdentity;
    identityFromUrl: FireflyIdentity;
    socialProfile?: Profile | null;
}) {
    const isMyProfile = useIsMyRelatedProfile(identity.source, identity.id);
    const { data = initialProfiles } = useQuery({
        queryKey: ['logged-in-firefly-profiles', identityFromUrl.source, identityFromUrl.id],
        enabled: isMyProfile,
        queryFn: async () => {
            try {
                const relatedProfiles = await getAllRelatedProfilesWithDefault({
                    source: identityFromUrl.source as ProfilePageSource,
                    id: identityFromUrl.id,
                });
                return formatFireflyProfilesFromWalletProfiles(relatedProfiles) as FireflyProfile[];
            } catch {
                return null;
            }
        },
        initialData: initialProfiles,
    });

    const profiles = data || initialProfiles;
    const sortFireflyProfiles = useSortFireflyProfiles();

    if (profiles.length <= 1) return null;
    const sources = SORTED_PROFILE_SOURCES.filter(
        (source) => profiles.filter((profile) => profile.identity.source === source).length,
    );
    return (
        <ProfileSourceTabsContainer>
            {sources.map((source, i) => {
                const isLast = sources.length - 1 === i;
                const currentSourceProfiles = profiles
                    .filter((profile) => profile.identity.source === source)
                    .sort((a, b) => sortFireflyProfiles(source, identity, a, b));
                const defaultProfile = first(currentSourceProfiles);
                if (!defaultProfile) return null;
                const isCurrentSource =
                    identity.source === source || (source === Source.Wallet && identity.source === Source.WalletMix);
                const isWalletProfile = source === Source.Wallet;
                const topProfile = defaultProfile;

                if (currentSourceProfiles.length === 1) {
                    return (
                        <TriggerButton
                            profile={topProfile}
                            identity={identity}
                            key={identity.id}
                            socialProfile={socialProfile}
                        />
                    );
                }

                return (
                    <Menu key={source}>
                        {({ close }) => (
                            <div>
                                <TriggerButton profile={topProfile} identity={identity} menu isLast={isLast} />
                                <MenuItems
                                    transition
                                    anchor="bottom"
                                    className={classNames(
                                        'z-[1000] max-h-[200px] max-w-[108px] -translate-y-6 cursor-default overflow-y-auto overflow-x-hidden rounded-lg bg-white text-xs text-white outline-none transition data-[closed]:opacity-0',
                                        {
                                            'text-farcasterPrimary': source === Source.Farcaster,
                                            'text-lensPrimary': source === Source.Lens,
                                            'text-mainLight': source === Source.Twitter,
                                            'text-bskyPrimary': source === Source.Bsky,
                                            'text-highlight dark:bg-walletBg': isWalletProfile,
                                        },
                                    )}
                                    onMouseLeave={close}
                                >
                                    <div
                                        className={classNames(
                                            'no-scrollbar max-h-[400px] w-full flex-col overflow-y-auto rounded-lg px-2',
                                            isCurrentSource
                                                ? {
                                                      'bg-farcasterPrimary text-white': source === Source.Farcaster,
                                                      'bg-lensPrimary text-lensText': source === Source.Lens,
                                                      'bg-lightMain text-primaryBottom': source === Source.Twitter,
                                                      'bg-bskyPrimary text-white': source === Source.Bsky,
                                                      'bg-highlight text-white': isWalletProfile,
                                                  }
                                                : {
                                                      'bg-farcasterPrimary/10 text-farcasterPrimary':
                                                          source === Source.Farcaster,
                                                      'bg-lensPrimary/10 text-lensText': source === Source.Lens,
                                                      'bg-mainLight/10 text-mainLight': source === Source.Twitter,
                                                      'bg-bskyPrimary/10 text-bskyPrimary': source === Source.Bsky,
                                                      'bg-highlight/10 text-highlight dark:bg-walletBg dark:text-white':
                                                          isWalletProfile,
                                                  },
                                        )}
                                    >
                                        <TopProfileMenuItem profile={defaultProfile} identity={identity} />
                                        {currentSourceProfiles.map((profile) => {
                                            const isCurrentFireflyIdentity = isSameFireflyIdentity(
                                                profile.identity,
                                                defaultProfile.identity,
                                            );
                                            if (
                                                isCurrentFireflyIdentity &&
                                                envs.external.NEXT_PUBLIC_WALLET_MIX === STATUS.Disabled &&
                                                source === Source.Wallet
                                            )
                                                return null;
                                            if (!isWalletProfile && isCurrentFireflyIdentity) return null;
                                            return <ProfileMenuItem profile={profile} key={profile.identity.id} />;
                                        })}
                                    </div>
                                </MenuItems>
                            </div>
                        )}
                    </Menu>
                );
            })}
        </ProfileSourceTabsContainer>
    );
}
