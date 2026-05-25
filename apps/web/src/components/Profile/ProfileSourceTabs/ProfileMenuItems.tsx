import ArrowLineDownIcon from '@dimensiondev/assets/arrow-line-down.svg';
import FireflyLogo from '@dimensiondev/assets/firefly.round.svg';
import type { ProfilePageSource } from '@dimensiondev/enums';
import { Source, STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';
import { classNames, delay } from '@dimensiondev/utils';
import { MenuItem } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { useState } from 'react';
import { useMount } from 'react-use';

import { Avatar } from '@/components/Avatar.js';
import { Link } from '@/components/Link.js';
import { SourceIcon } from '@/components/Profile/ProfileSourceTabs/SourceIcon.js';
import { usePathname } from '@/esm/navigation.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getStampAvatarByFireflyProfile } from '@/helpers/getStampAvatarByProfileId.js';
import { isMPCWallet } from '@/helpers/isMPCWallet.js';
import { isProfilePageSource } from '@/helpers/isSource.js';
import { captureProfileAccountClickSimple } from '@/providers/telemetry/captureProfileAccountEvent.js';
import { captureProfileChangeAccountClick } from '@/providers/telemetry/captureProfileActionEvent.js';
import type { FireflyIdentity, FireflyProfile, WalletProfile } from '@/providers/types/Firefly.js';

export function TopProfileMenuItem({ profile, identity }: { profile: FireflyProfile; identity: FireflyIdentity }) {
    const pathname = usePathname();
    const source = profile.identity.source as ProfilePageSource;
    const [isMounted, setIsMounted] = useState(false);

    useMount(async () => {
        await delay(500);
        setIsMounted(true);
    });

    if (!isProfilePageSource(source)) return null;
    const isWalletProfile = source === Source.Wallet;
    const origin = isWalletProfile ? (profile.__origin__ as WalletProfile) : null;
    const isMPC = !!origin && isMPCWallet(origin);
    const isCurrentSource =
        identity.source === source || (source === Source.Wallet && identity.source === Source.WalletMix);

    const href =
        isWalletProfile && envs.external.NEXT_PUBLIC_WALLET_MIX === STATUS.Enabled
            ? getProfileUrl({ source: Source.WalletMix, profileId: profile.identity.id })
            : getProfileUrl({ source, profileId: profile.identity.id, handle: profile.displayName });

    const className = classNames('flex h-6 cursor-pointer flex-row items-center', {
        'pointer-events-none': !isMounted || pathname === href,
    });

    if (envs.external.NEXT_PUBLIC_WALLET_MIX === STATUS.Enabled && isWalletProfile) {
        return (
            <Link
                href={href}
                className={className}
                onClick={() => {
                    captureProfileChangeAccountClick(source, profile.identity.id);
                    captureProfileAccountClickSimple(source, profile.identity.id, profile.displayName || '');
                }}
            >
                <span
                    className={classNames(
                        'inline-flex size-3.5 shrink-0 items-center justify-center rounded bg-highlight text-white',
                        {
                            'outline outline-[0.5px] outline-current': isCurrentSource,
                        },
                    )}
                >
                    <SourceIcon source={source} size={12} isMPC={isMPC} />
                </span>
                <span className="mx-1 min-w-0 truncate">
                    <Trans>Wallets</Trans>
                </span>
                <ArrowLineDownIcon width={12} height={12} className="ml-auto shrink-0" />
            </Link>
        );
    }

    return (
        <Link
            href={href}
            className={className}
            onClick={() => {
                captureProfileChangeAccountClick(source, profile.identity.id);
                captureProfileAccountClickSimple(source, profile.identity.id, profile.displayName || '');
            }}
        >
            <span
                className={classNames('inline-flex size-3.5 shrink-0 items-center justify-center rounded', {
                    'bg-farcasterPrimary text-white': source === Source.Farcaster,
                    'bg-lensPrimary text-lensText': source === Source.Lens,
                    'bg-mainLight text-white': source === Source.Twitter,
                    'bg-bskyPrimary text-white': source === Source.Bsky,
                    'bg-highlight text-white': isWalletProfile && !(profile.__origin__ as WalletProfile)?.hacked,
                    'outline outline-[0.5px] outline-current': isCurrentSource,
                })}
            >
                <SourceIcon source={source} size={12} isMPC={isMPC} />
            </span>
            <span className="mx-1 min-w-0 truncate">
                {isWalletProfile ? '' : '@'}
                {profile.displayName}
            </span>
            <ArrowLineDownIcon width={12} height={12} className="ml-auto shrink-0" />
        </Link>
    );
}

export function ProfileMenuItem({ profile }: { profile: FireflyProfile }) {
    const source = profile.identity.source;
    if (!isProfilePageSource(source)) return null;
    const origin = profile.identity.source === Source.Wallet ? (profile.__origin__ as WalletProfile) : null;
    const isHacked = origin?.hacked ?? false;
    const isMPC = !!origin && isMPCWallet(origin);
    return (
        <MenuItem>
            <Link
                href={getProfileUrl({ source, profileId: profile.identity.id, handle: profile.displayName })}
                onClick={() => {
                    captureProfileChangeAccountClick(source, profile.identity.id);
                    captureProfileAccountClickSimple(source, profile.identity.id, profile.displayName || '');
                }}
                key={profile.identity.id}
                className="flex h-6 w-full items-center space-x-1 truncate leading-6 hover:opacity-60"
            >
                {isHacked ? (
                    <SourceIcon source={Source.Wallet} size={14} danger />
                ) : isMPC ? (
                    <FireflyLogo width={14} height={14} className="shrink-0" />
                ) : (
                    <Avatar size={14} alt={profile.identity.id} src={getStampAvatarByFireflyProfile(profile)} />
                )}
                <span className="ml-1 min-w-0 truncate pr-4">
                    {source === Source.Wallet ? '' : '@'}
                    {profile.displayName}
                </span>
            </Link>
        </MenuItem>
    );
}
