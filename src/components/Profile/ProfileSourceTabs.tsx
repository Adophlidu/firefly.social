'use client';

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { delay } from '@masknet/kit';
import { useQuery } from '@tanstack/react-query';
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
import { type ProfilePageSource, Source, STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { SORTED_PROFILE_SOURCES } from '@/constants/index.js';
import { usePathname } from '@/esm/navigation.js';
import { classNames } from '@/helpers/classNames.js';
import { getStampAvatarByFireflyProfile } from '@/helpers/getStampAvatarByProfileId.js';
import { isSameFireflyIdentity } from '@/helpers/isSameFireflyIdentity.js';
import { isProfilePageSource, isSocialSource } from '@/helpers/isSource.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveValue } from '@/helpers/resolveValue.js';
import { captureProfileChangeAccountClick } from '@/providers/telemetry/captureProfileActionEvent.js';
import type { FireflyIdentity, FireflyProfile, WalletProfile } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

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
                ref.current?.parentElement?.scrollTo({
                    left: ref.current.parentElement?.scrollWidth ?? 1000,
                    behavior: 'instant',
                });
                return;
            }
            ref.current?.scrollIntoView({ behavior: 'auto' });
        }
    }, [isLast, isCurrentSource]);

    const { data } = useQuery({
        queryKey: ['profile', source, identity.id],
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

    const displayName = source === Source.Wallet ? handle : handle ? `@${handle}` : '';

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
            href={resolveProfileUrl(source, profile.identity.id)}
            className={triggerClassName}
            onClick={() => {
                captureProfileChangeAccountClick(source, identity.id);
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
            ? resolveProfileUrl(Source.WalletMix, profile.identity.id)
            : resolveProfileUrl(source, profile.identity.id);

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
                href={resolveProfileUrl(source, profile.identity.id)}
                onClick={() => {
                    captureProfileChangeAccountClick(source, profile.identity.id);
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
        <div
            className="no-scrollbar align-center relative flex w-full overflow-x-auto overflow-y-auto px-4 pb-2.5 pt-2"
            ref={ref}
            onScroll={(e) => handleButtons(e.currentTarget)}
        >
            <button
                className={classNames(
                    'sticky left-0 z-10 -mr-10 flex h-full -translate-x-4 transform cursor-pointer items-center pl-4 duration-100 hover:text-highlight',
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

            {children}
            <button
                className={classNames(
                    'sticky right-0 z-10 -ml-10 flex h-full transform cursor-pointer items-center pl-4 duration-100 hover:text-highlight',
                    {
                        'pointer-events-none opacity-0': hiddenRight,
                    },
                )}
                onClick={() => onScrollTo(ScrollDirection.Right)}
            >
                <span className="absolute left-0 top-0 h-full w-14 bg-gradient-to-r from-transparent to-primaryBottom to-55%" />
                <span className="shadow-action relative flex size-5 shrink-0 items-center justify-center rounded-full border border-line bg-primaryBottom">
                    <ArrowRightIcon className="relative h-2 w-auto shrink-0" />
                </span>
            </button>
        </div>
    );
}

function SingleTriggerButton({
    identity,
    socialProfile,
}: {
    identity: FireflyIdentity;
    socialProfile?: Profile | null;
}) {
    return (
        <div className="no-scrollbar align-center relative flex w-full overflow-x-auto overflow-y-auto px-4 pb-2.5 pt-2">
            <TriggerButton
                profile={{
                    identity,
                    displayName: socialProfile?.handle ?? identity.id,
                }}
                identity={identity}
            />
        </div>
    );
}

export function ProfileSourceTabs({
    profiles,
    identity,
    socialProfile,
}: {
    profiles: FireflyProfile[];
    identity: FireflyIdentity;
    socialProfile?: Profile | null;
}) {
    const sources = SORTED_PROFILE_SOURCES.filter(
        (source) => profiles.filter((profile) => profile.identity.source === source).length,
    );

    if (sources.length <= 0 && isSocialSource(identity.source)) {
        return <SingleTriggerButton identity={identity} socialProfile={socialProfile} />;
    }

    return (
        <ProfileSourceTabsContainer>
            {sources.map((source, i) => {
                const isLast = sources.length - 1 === i;
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
                const isCurrentSource =
                    identity.source === source || (source === Source.Wallet && identity.source === Source.WalletMix);
                const isWalletProfile = source === Source.Wallet;
                const topProfile = currentProfile ?? defaultProfile;

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
                            <>
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
                                            'text-highlight': isWalletProfile,
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
                            </>
                        )}
                    </Menu>
                );
            })}
        </ProfileSourceTabsContainer>
    );
}
