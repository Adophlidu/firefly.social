'use client';

import { Menu, MenuButton, MenuItems } from '@headlessui/react';

import ArrowLineDownIcon from '@/assets/arrow-line-down.svg';
import WalletIcon from '@/assets/wallet-bold.svg';
import { Avatar } from '@/components/Avatar.js';
import { Link } from '@/components/Link.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { type ProfilePageSource, Source } from '@/constants/enum.js';
import { SORTED_PROFILE_SOURCES } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { isSameFireflyIdentity } from '@/helpers/isSameFireflyIdentity.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';
import type { FireflyIdentity, FireflyProfile, WalletProfile } from '@/providers/types/Firefly.js';
import DangerIcon from '@/assets/danger.svg';

function SourceIcon({ source, size, profile }: { source: ProfilePageSource; size: number; profile?: FireflyProfile }) {
    if (source === Source.Wallet) {
        if ((profile?.__origin__ as WalletProfile)?.hacked)
            return <DangerIcon width={size} height={size} className="shrink-0" />;
        return <WalletIcon width={size} height={size} className="shrink-0" />;
    }
    return <SocialSourceIcon source={source} size={size} className="shrink-0" mono />;
}

export function ProfileSourceTabs({ profiles, identity }: { profiles: FireflyProfile[]; identity: FireflyIdentity }) {
    return (
        <div className="no-scrollbar flex w-full overflow-x-auto overflow-y-auto px-4 pb-2.5 pt-2">
            {SORTED_PROFILE_SOURCES.map((source) => {
                const currentSourceProfiles = profiles
                    .filter((profile) => profile.identity.source === source)
                    .sort((a, b) => {
                        const priorityA = isSameFireflyIdentity(a.identity, identity) ? 2 : a.isDefault ? 1 : 0;
                        const priorityB = isSameFireflyIdentity(b.identity, identity) ? 2 : b.isDefault ? 1 : 0;
                        return priorityB - priorityA;
                    });
                const defaultProfile = currentSourceProfiles.find((x) => x.isDefault) ?? currentSourceProfiles[0];
                const currentProfile = currentSourceProfiles.find((profile) =>
                    isSameFireflyIdentity(profile.identity, identity),
                );
                if (!defaultProfile) return null;
                const isCurrentSource = identity.source === source;
                const isWalletProfile = source === Source.Wallet;
                const topProfile = currentProfile ?? defaultProfile;
                const topProfileHacked =
                    topProfile.identity.source === Source.Wallet
                        ? ((topProfile?.__origin__ as WalletProfile)?.hacked ?? false)
                        : false;

                const triggerClassName = classNames(
                    'group mr-2.5 flex h-6 flex-row items-center rounded-lg px-2 py-1 text-xs outline-none duration-100',
                    isCurrentSource
                        ? {
                              'bg-farcasterPrimary text-white': source === Source.Farcaster,
                              'bg-lensPrimary text-lensText': source === Source.Lens,
                              'bg-mainLight text-white': source === Source.Twitter,
                              'bg-bskyPrimary text-white': source === Source.Bsky,
                              'bg-lightHighlight text-white': source === Source.Wallet,
                          }
                        : {
                              'bg-bg': true,
                              'hover:bg-farcasterPrimary hover:text-white': source === Source.Farcaster,
                              'hover:bg-lensPrimary hover:text-lensText': source === Source.Lens,
                              'hover:bg-mainLight hover:text-white': source === Source.Twitter,
                              'hover:bg-bskyPrimary hover:text-white': source === Source.Bsky,
                              'hover:bg-lightHighlight hover:text-white': source === Source.Wallet,
                          },
                );
                const trigger = (
                    <>
                        <span
                            className={classNames(
                                'inline-flex size-3.5 shrink-0 items-center justify-center rounded duration-100',
                                isCurrentSource
                                    ? 'outline outline-[0.5px] outline-current'
                                    : 'bg-main text-primaryBottom group-hover:bg-transparent group-hover:text-inherit group-hover:outline group-hover:outline-[0.5px] group-hover:outline-current',
                                {
                                    '!bg-transparent !outline-none': topProfileHacked,
                                },
                            )}
                        >
                            {topProfileHacked ? (
                                <DangerIcon width={14} height={14} className="shrink-0" />
                            ) : (
                                <SourceIcon source={source} size={12} />
                            )}
                        </span>
                        <span className="mx-1 min-w-0 truncate">
                            {isWalletProfile ? '' : '@'}
                            {topProfile.displayName}
                        </span>
                    </>
                );

                if (currentSourceProfiles.length === 1) {
                    return (
                        <Link
                            href={resolveProfileUrl(source, topProfile.identity.id)}
                            key={source}
                            className={triggerClassName}
                        >
                            {trigger}
                        </Link>
                    );
                }

                return (
                    <Menu key={source}>
                        {({ close }) => (
                            <>
                                <MenuButton className={triggerClassName} onMouseEnter={(e) => e.currentTarget.click()}>
                                    {trigger}
                                    <ArrowLineDownIcon width={12} height={12} className="ml-auto shrink-0" />
                                </MenuButton>
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
                                            'text-lightHighlight': source === Source.Wallet,
                                        },
                                    )}
                                    onMouseLeave={close}
                                >
                                    <div
                                        className={classNames(
                                            'w-full flex-col rounded-lg px-2',
                                            isCurrentSource
                                                ? {
                                                      'bg-farcasterPrimary text-white': source === Source.Farcaster,
                                                      'bg-lensPrimary text-lensText': source === Source.Lens,
                                                      'bg-mainLight text-white': source === Source.Twitter,
                                                      'bg-bskyPrimary text-white': source === Source.Bsky,
                                                      'bg-lightHighlight text-white': source === Source.Wallet,
                                                  }
                                                : {
                                                      'bg-farcasterPrimary/10 text-farcasterPrimary':
                                                          source === Source.Farcaster,
                                                      'bg-lensPrimary/10 text-lensText': source === Source.Lens,
                                                      'bg-mainLight/10 text-mainLight': source === Source.Twitter,
                                                      'bg-bskyPrimary/10 text-bskyPrimary': source === Source.Bsky,
                                                      'bg-lightHighlight/10 text-lightHighlight':
                                                          source === Source.Wallet,
                                                  },
                                        )}
                                    >
                                        <Link
                                            href={resolveProfileUrl(source, defaultProfile.identity.id)}
                                            className={classNames('flex h-6 cursor-pointer flex-row items-center', {
                                                'cursor-pointer': !isSameFireflyIdentity(
                                                    defaultProfile.identity,
                                                    identity,
                                                ),
                                            })}
                                            onClick={(e) => {
                                                if (isSameFireflyIdentity(defaultProfile.identity, identity)) {
                                                    e.preventDefault();
                                                }
                                            }}
                                        >
                                            <span
                                                className={classNames(
                                                    'inline-flex size-3.5 shrink-0 items-center justify-center rounded',
                                                    {
                                                        'bg-farcasterPrimary text-white': source === Source.Farcaster,
                                                        'bg-lensPrimary text-lensText': source === Source.Lens,
                                                        'bg-mainLight text-white': source === Source.Twitter,
                                                        'bg-bskyPrimary text-white': source === Source.Bsky,
                                                        'bg-lightHighlight text-white':
                                                            source === Source.Wallet &&
                                                            !(defaultProfile.__origin__ as WalletProfile)?.hacked,
                                                        'outline outline-[0.5px] outline-current': isCurrentSource,
                                                    },
                                                )}
                                            >
                                                <SourceIcon source={source} size={12} profile={defaultProfile} />
                                            </span>
                                            <span className="mx-1 min-w-0 truncate">
                                                {isWalletProfile ? '' : '@'}
                                                {defaultProfile.displayName}
                                            </span>
                                            <ArrowLineDownIcon width={12} height={12} className="ml-auto shrink-0" />
                                        </Link>
                                        {currentSourceProfiles.map((profile) => {
                                            if (isSameFireflyIdentity(profile.identity, defaultProfile.identity)) {
                                                return null;
                                            }
                                            const isHacked =
                                                profile.identity.source === Source.Wallet
                                                    ? ((profile?.__origin__ as WalletProfile)?.hacked ?? false)
                                                    : false;
                                            return (
                                                <Link
                                                    href={resolveProfileUrl(source, profile.identity.id)}
                                                    key={profile.identity.id}
                                                    className="flex h-6 w-full items-center space-x-1 truncate leading-6 hover:opacity-60"
                                                >
                                                    {isHacked ? (
                                                        <SourceIcon
                                                            source={Source.Wallet}
                                                            profile={profile}
                                                            size={14}
                                                        />
                                                    ) : (
                                                        <Avatar
                                                            size={14}
                                                            alt={profile.identity.id}
                                                            src={getStampAvatarByProfileId(
                                                                profile.identity.source,
                                                                profile.identity.id,
                                                            )}
                                                        />
                                                    )}
                                                    <span className="ml-1 min-w-0 truncate pr-4">
                                                        {isWalletProfile ? '' : '@'}
                                                        {profile.displayName}
                                                    </span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </MenuItems>
                            </>
                        )}
                    </Menu>
                );
            })}
        </div>
    );
}
