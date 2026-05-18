import { Source, STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs';
import { classNames } from '@dimensiondev/utils';
import { MenuButton } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { type Ref, useLayoutEffect, useRef } from 'react';

import { Link } from '@/components/Link.js';
import { PROFILE_SOURCE_TABS_CONTAINER_ID } from '@/components/Profile/ProfileSourceTabs/constants.js';
import { ProfileTriggerContent } from '@/components/Profile/ProfileSourceTabs/SourceIcon.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { isMPCWallet } from '@/helpers/isMPCWallet.js';
import { isSameFireflyIdentity } from '@/helpers/isSameFireflyIdentity.js';
import { isProfilePageSource, isSocialSource } from '@/helpers/isSource.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { captureProfileAccountClickSimple } from '@/providers/telemetry/captureProfileAccountEvent.js';
import { captureProfileChangeAccountClick } from '@/providers/telemetry/captureProfileActionEvent.js';
import type { FireflyIdentity, FireflyProfile, WalletProfile } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export function TriggerButton({
    profile,
    identity,
    socialProfile,
    menu = false,
    isLast = false,
}: {
    profile: Pick<FireflyProfile, 'identity' | 'displayName' | '__origin__'>;
    identity: FireflyIdentity;
    menu?: boolean;
    isLast?: boolean;
    socialProfile?: Profile | null;
}) {
    const source = profile.identity.source;
    const isWalletProfile = source === Source.Wallet;
    const isMPC =
        isWalletProfile &&
        !!(profile.__origin__ as WalletProfile | undefined) &&
        isMPCWallet(profile.__origin__ as WalletProfile);
    const isCurrentSource =
        identity.source === source || (source === Source.Wallet && identity.source === Source.WalletMix);
    const ref = useRef<HTMLButtonElement | HTMLAnchorElement>(null);
    useLayoutEffect(() => {
        if (isCurrentSource) {
            if (isLast) {
                const containerElement = document.getElementById(PROFILE_SOURCE_TABS_CONTAINER_ID);
                if (containerElement) {
                    containerElement.scrollTo({
                        left: containerElement.scrollWidth ?? 1000,
                        behavior: 'instant',
                    });
                    return;
                }
            }
            ref.current?.scrollIntoView({ behavior: 'auto' });
        }
    }, [isLast, isCurrentSource]);

    const myProfile = useCurrentProfile(narrowToSocialSource(source));
    const { data } = useQuery({
        queryKey: ['profile', source, identity.id, myProfile?.profileId],
        queryFn: () => {
            if (!isSocialSource(source)) return;
            return resolveSocialMediaProvider(source).getProfileByIdOrHandle(identity.id);
        },
        enabled: isSocialSource(source) && !profile.displayName,
        initialData: () => (source === socialProfile?.source ? socialProfile : undefined),
    });

    const handle = data?.handle ?? profile.displayName;

    if (!isProfilePageSource(source)) return null;

    const triggerClassName = classNames(
        'group mr-2.5 flex h-6 max-w-[200px] flex-row items-center rounded-lg px-2 py-1 text-xs outline-none duration-100',
        isCurrentSource
            ? {
                  'bg-farcasterPrimary text-white': source === Source.Farcaster,
                  'bg-lensPrimary text-lensText': source === Source.Lens,
                  'bg-lightMain text-primaryBottom': source === Source.Twitter,
                  'bg-bskyPrimary text-white': source === Source.Bsky,
                  'bg-highlight text-white': source === Source.Wallet,
              }
            : {
                  'bg-bg': true,
                  'hover:bg-farcasterPrimary hover:text-white': source === Source.Farcaster,
                  'hover:bg-lensPrimary hover:text-lensText': source === Source.Lens,
                  'hover:bg-lightMain hover:text-primaryBottom': source === Source.Twitter,
                  'hover:bg-bskyPrimary hover:text-white': source === Source.Bsky,
                  'hover:bg-highlight hover:text-white': source === Source.Wallet,
              },
    );

    const displayName = source === Source.Wallet ? handle : handle ? `@${handle}` : null;

    if (menu) {
        const isNotWalletMixIdentity =
            identity.source !== Source.WalletMix && isSameFireflyIdentity(identity, profile.identity);
        return (
            <MenuButton
                ref={ref as Ref<HTMLButtonElement>}
                className={triggerClassName}
                onMouseEnter={(e) => e.currentTarget.click()}
            >
                <ProfileTriggerContent active={isCurrentSource} source={source} square arrow isMPC={isMPC}>
                    {envs.external.NEXT_PUBLIC_WALLET_MIX === STATUS.Disabled ||
                    source !== Source.Wallet ||
                    isNotWalletMixIdentity ? (
                        displayName
                    ) : (
                        <Trans>Wallets</Trans>
                    )}
                </ProfileTriggerContent>
            </MenuButton>
        );
    }

    return (
        <Link
            ref={ref as Ref<HTMLAnchorElement>}
            href={getProfileUrl({ source, profileId: profile.identity.id, handle: profile.displayName })}
            className={triggerClassName}
            onClick={() => {
                captureProfileChangeAccountClick(source, identity.id);
                captureProfileAccountClickSimple(source, profile.identity.id, profile.displayName || '');
            }}
        >
            <ProfileTriggerContent active={isCurrentSource} source={source} square isMPC={isMPC}>
                {displayName}
            </ProfileTriggerContent>
        </Link>
    );
}
