'use client';

import { classNames, delay } from '@dimensiondev/utils';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { first } from 'lodash-es';
import {
    type HTMLProps,
    type PropsWithChildren,
    type Ref,
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { useMount } from 'react-use';

import ArrowLeftIcon from '@/assets/arrow-left.svg';
import ArrowLineDownIcon from '@/assets/arrow-line-down.svg';
import ArrowRightIcon from '@/assets/arrow-right.svg';
import DangerIcon from '@/assets/danger.svg';
import WalletIcon from '@/assets/wallet-bold.svg';
import { Avatar } from '@/components/Avatar.js';
import { Link } from '@/components/Link.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { SORTED_PROFILE_SOURCES } from '@/constants/computed.js';
import { type ProfilePageSource, type SocialSource, Source, STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { usePathname } from '@/esm/navigation.js';
import { formatFireflyProfilesFromWalletProfiles } from '@/helpers/formatFireflyProfilesFromWalletProfiles.js';
import { getFollowerCount } from '@/helpers/getFollowerCount.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getStampAvatarByFireflyProfile } from '@/helpers/getStampAvatarByProfileId.js';
import { isSameFireflyIdentity } from '@/helpers/isSameFireflyIdentity.js';
import { isProfilePageSource, isSocialSource } from '@/helpers/isSource.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveValue } from '@/helpers/resolveValue.js';
import { useCurrentProfile, useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { useIsMyRelatedProfile } from '@/hooks/useIsMyRelatedProfile.js';
import { useThrottledCallback } from '@/hooks/useThrottledCallback.js';
import { captureProfileAccountClickSimple } from '@/providers/telemetry/captureProfileAccountEvent.js';
import { captureProfileChangeAccountClick } from '@/providers/telemetry/captureProfileActionEvent.js';
import {
    type FireflyIdentity,
    type FireflyProfile,
    type WalletProfile,
    WalletProfileDataSource,
} from '@/providers/types/Firefly.js';
import { type Profile } from '@/providers/types/SocialMedia.js';
import { getAllRelatedProfilesWithDefault } from '@/services/getAllRelatedProfilesWithDefault.js';

const PROFILE_SOURCE_TABS_CONTAINER_ID = 'profile-source-tabs-container';

function SourceIcon({
    source,
    size,
    danger = false,
    square = false,
    active = false,
}: {
    source: ProfilePageSource;
    size: number;
    danger?: boolean;
    square?: boolean;
    active?: boolean;
}) {
    if (danger) return <DangerIcon width={size} height={size} className="shrink-0" />;
    size = square ? size - 2 : size;
    const icon = resolveValue(() => {
        if (source === Source.Wallet || source === Source.WalletMix) {
            return <WalletIcon width={size} height={size} className="shrink-0" />;
        }
        return <SocialSourceIcon source={source} size={size} className="shrink-0" mono />;
    });
    return square ? (
        <span
            className={classNames(
                'inline-flex shrink-0 items-center justify-center rounded duration-100',
                active
                    ? 'outline outline-[0.5px] outline-current'
                    : 'bg-main text-primaryBottom group-hover:bg-transparent group-hover:text-inherit group-hover:outline group-hover:outline-[0.5px] group-hover:outline-current',
            )}
            style={{ width: `${size + 2}px`, height: `${size + 2}px` }}
        >
            {icon}
        </span>
    ) : (
        icon
    );
}

interface ProfileMenuItemProps extends Pick<HTMLProps<'div'>, 'className' | 'children'> {
    source: ProfilePageSource;
    danger?: boolean;
    arrow?: boolean;
    square?: boolean;
    active?: boolean;
}

function ProfileTriggerContent({
    children,
    source,
    arrow = false,
    square = false,
    danger = false,
    active = false,
    className,
}: ProfileMenuItemProps) {
    return (
        <span className={classNames('inline-flex items-center justify-center', className)}>
            <SourceIcon source={source} size={14} square={square} danger={danger} active={active} />
            <span className="mx-1 min-w-0 truncate">{children}</span>
            {arrow ? <ArrowLineDownIcon width={12} height={12} className="ml-auto shrink-0" /> : null}
        </span>
    );
}

function TriggerButton({
    profile,
    identity,
    socialProfile,
    menu = false,
    isLast = false,
}: {
    profile: Pick<FireflyProfile, 'identity' | 'displayName'>;
    identity: FireflyIdentity;
    menu?: boolean;
    isLast?: boolean;
    socialProfile?: Profile | null;
}) {
    const source = profile.identity.source;
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
        'group mr-2.5 flex h-6 flex-row items-center rounded-lg px-2 py-1 text-xs outline-none duration-100',
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
                <ProfileTriggerContent active={isCurrentSource} source={source} square arrow>
                    {env.external.NEXT_PUBLIC_WALLET_MIX === STATUS.Disabled ||
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
            <ProfileTriggerContent active={isCurrentSource} source={source} square>
                {displayName}
            </ProfileTriggerContent>
        </Link>
    );
}

function TopProfileMenuItem({ profile, identity }: { profile: FireflyProfile; identity: FireflyIdentity }) {
    const pathname = usePathname();
    const source = profile.identity.source as ProfilePageSource;
    const [isMounted, setIsMounted] = useState(false);

    useMount(async () => {
        await delay(500);
        setIsMounted(true);
    });

    if (!isProfilePageSource(source)) return null;
    const isWalletProfile = source === Source.Wallet;
    const isCurrentSource =
        identity.source === source || (source === Source.Wallet && identity.source === Source.WalletMix);

    const href =
        isWalletProfile && env.external.NEXT_PUBLIC_WALLET_MIX === STATUS.Enabled
            ? getProfileUrl({ source: Source.WalletMix, profileId: profile.identity.id })
            : getProfileUrl({ source, profileId: profile.identity.id, handle: profile.displayName });

    const className = classNames('flex h-6 cursor-pointer flex-row items-center', {
        'pointer-events-none': !isMounted || pathname === href,
    });

    if (env.external.NEXT_PUBLIC_WALLET_MIX === STATUS.Enabled && isWalletProfile) {
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
                    <SourceIcon source={source} size={12} />
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
                <SourceIcon source={source} size={12} />
            </span>
            <span className="mx-1 min-w-0 truncate">
                {isWalletProfile ? '' : '@'}
                {profile.displayName}
            </span>
            <ArrowLineDownIcon width={12} height={12} className="ml-auto shrink-0" />
        </Link>
    );
}

function ProfileMenuItem({ profile }: { profile: FireflyProfile }) {
    const source = profile.identity.source;
    if (!isProfilePageSource(source)) return null;
    const isHacked =
        profile.identity.source === Source.Wallet ? ((profile?.__origin__ as WalletProfile)?.hacked ?? false) : false;
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

const enum ScrollDirection {
    Left = 'left',
    Right = 'right',
}

function ProfileSourceTabsContainer({ children }: PropsWithChildren) {
    const [hiddenLeft, setHiddenLeft] = useState(true);
    const [hiddenRight, setHiddenRight] = useState(true);
    const handleButtons = useCallback((target: HTMLElement) => {
        if (target.scrollWidth <= target.clientWidth) {
            setHiddenLeft(true);
            setHiddenRight(true);
            return;
        }
        setHiddenLeft(target.scrollLeft <= 0);
        setHiddenRight(Math.round(target.scrollLeft) >= Math.trunc(target.scrollWidth - target.clientWidth));
    }, []);

    // Throttle scroll handler for better performance
    const throttledHandleButtons = useThrottledCallback(handleButtons);

    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        const resizeObserver = new ResizeObserver(() => handleButtons(element));
        resizeObserver.observe(element);
        handleButtons(element);
        return () => resizeObserver.disconnect();
    }, [handleButtons]);

    function onScrollTo(direction: ScrollDirection) {
        const element = ref.current;
        if (!element) return;
        element.scrollTo({
            behavior: 'smooth',
            left: direction === ScrollDirection.Left ? 0 : element.scrollWidth,
        });
    }

    return (
        <div className="align-center relative w-full px-4">
            <button
                className={classNames(
                    'absolute left-0 z-10 flex h-full transform-gpu cursor-pointer items-center pl-4 duration-100 hover:text-highlight',
                    {
                        'pointer-events-none opacity-0': hiddenLeft,
                    },
                )}
                onClick={() => onScrollTo(ScrollDirection.Left)}
            >
                <span className="absolute left-0 top-0 h-full w-14 bg-gradient-to-l from-transparent to-primaryBottom to-55%" />
                <span className="shadow-action relative flex size-5 shrink-0 items-center justify-center rounded-full border border-line bg-primaryBottom">
                    <ArrowLeftIcon className="relative h-2 w-auto shrink-0" />
                </span>
            </button>
            <button
                className={classNames(
                    'absolute right-0 z-10 flex h-full transform-gpu cursor-pointer items-center pr-4 duration-100 hover:text-highlight',
                    {
                        'pointer-events-none opacity-0': hiddenRight,
                    },
                )}
                onClick={() => onScrollTo(ScrollDirection.Right)}
            >
                <span className="absolute right-0 top-0 h-full w-14 bg-gradient-to-r from-transparent to-primaryBottom to-55%" />
                <span className="shadow-action relative flex size-5 shrink-0 items-center justify-center rounded-full border border-line bg-primaryBottom">
                    <ArrowRightIcon className="relative h-2 w-auto shrink-0" />
                </span>
            </button>
            <div
                className="no-scrollbar align-center relative flex w-full overflow-auto pb-2.5 pt-2"
                ref={ref}
                onScroll={(e) => throttledHandleButtons(e.currentTarget)}
                id={PROFILE_SOURCE_TABS_CONTAINER_ID}
            >
                {children}
            </div>
        </div>
    );
}

function useSortFireflyProfiles() {
    const profileAll = useCurrentProfilesAll();
    return useCallback(
        (source: ProfilePageSource, identity: FireflyIdentity, a: FireflyProfile, b: FireflyProfile) => {
            const getSortLevel = (profile: FireflyProfile) => {
                // Level 5: Currently viewed identity (highest priority)
                if (isSameFireflyIdentity(profile.identity, identity)) return 5;

                // Level 4: Logged-in profile for this source
                if (profileAll?.[source as SocialSource]?.profileId === profile.identity.id) return 4;

                // Level 3: Default profile
                if (profile?.isDefault) return 3;

                // Level 2: MPC wallet (wallet profiles only)
                if (
                    source === Source.Wallet &&
                    (profile?.__origin__ as WalletProfile)?.dataSource === WalletProfileDataSource.Privy
                )
                    return 2;

                // Level 1: Connected accounts (has connectedAt timestamp)
                // Check if the profile has connectedAt field in __origin__
                const origin = profile.__origin__ as any;
                if (isSocialSource(source) && origin?.connectedAt) return 1;

                // Level 0: Related accounts (no connectedAt)
                return 0;
            };

            const levelDiff = getSortLevel(b) - getSortLevel(a);
            if (levelDiff !== 0) return levelDiff;

            // Within same level, sort social profiles by follower count
            if (isSocialSource(source)) {
                const followerDiff = getFollowerCount(b) - getFollowerCount(a);
                if (followerDiff !== 0) return followerDiff;
            }

            // Fallback: alphabetical by display name
            return (a.displayName || '').localeCompare(b.displayName || '');
        },
        [profileAll],
    );
}

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
                                                env.external.NEXT_PUBLIC_WALLET_MIX === STATUS.Disabled &&
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
