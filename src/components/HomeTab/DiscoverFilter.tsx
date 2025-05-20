'use client';

import { Checkbox, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { safeUnreachable } from '@masknet/kit';
import { Fragment } from 'react';

import FilterIcon from '@/assets/filter.svg';
import WalletIcon from '@/assets/wallet.svg';
import { CircleCheckboxIcon } from '@/components/CircleCheckboxIcon.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { type FollowingSource, HomeTab, type SocialSource, Source } from '@/constants/enum.js';
import { SOCIAL_DISCOVER_SOURCE_LOGIN_REQUIRED } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { useSocialDiscoverSourcesWithWhitelist } from '@/hooks/useSocialDiscoverSourcesWithWhitelist.js';
import { LoginModalRef } from '@/modals/controls.js';
import { FollowingTimelinePlatform } from '@/providers/types/Firefly.js';
import { useDiscoverStore } from '@/store/useDiscoverStore.js';

interface Props {
    tab: HomeTab;
    source: FollowingSource;
}

function FollowingTimelinePlatformIcon({ platform }: { platform: FollowingTimelinePlatform }) {
    switch (platform) {
        case FollowingTimelinePlatform.Lens:
            return <SocialSourceIcon source={Source.Lens} width={15} height={15} className="mr-2 shrink-0" mono />;
        case FollowingTimelinePlatform.Twitter:
            return <SocialSourceIcon source={Source.Twitter} width={15} height={15} className="mr-2 shrink-0" mono />;
        case FollowingTimelinePlatform.Farcaster:
            return <SocialSourceIcon source={Source.Farcaster} width={15} height={15} className="mr-2 shrink-0" mono />;
        case FollowingTimelinePlatform.Wallet:
            return <WalletIcon width={15} height={15} className="mr-2 shrink-0" />;
        case FollowingTimelinePlatform.All:
            return null;
        default:
            safeUnreachable(platform);
            return null;
    }
}

function FollowingTimelinePlatformText({ platform }: { platform: FollowingTimelinePlatform }) {
    switch (platform) {
        case FollowingTimelinePlatform.Twitter:
            return <Trans>Following X</Trans>;
        case FollowingTimelinePlatform.Wallet:
            return <Trans>Watching address</Trans>;
        case FollowingTimelinePlatform.Farcaster:
            return <Trans>Following Farcaster</Trans>;
        case FollowingTimelinePlatform.Lens:
            return <Trans>Following Lens</Trans>;
        case FollowingTimelinePlatform.All:
            return <Trans>All</Trans>;
        default:
            safeUnreachable(platform);
            return null;
    }
}

function PlatformItem({
    source,
    loginRequest = false,
    tab,
    onClose,
}: {
    tab: HomeTab;
    source: SocialSource;
    loginRequest?: boolean;
    onClose?: () => void;
}) {
    const postTimelinePlatforms = useDiscoverStore((state) => state.postTimelinePlatforms);
    const setFilteredPlatform = useDiscoverStore((state) => state.setFilteredPlatform);
    const checked = postTimelinePlatforms[tab].includes(source);
    const isLogin = useIsLogin(source);
    return (
        <a
            className={classNames(
                'flex w-full cursor-pointer flex-row items-center justify-between py-1 hover:text-main',
                {
                    'text-placeholder': !checked || (loginRequest && !isLogin),
                },
            )}
            onClick={() => {
                if (loginRequest && !isLogin) {
                    onClose?.();
                    LoginModalRef.open({
                        source,
                    });
                    setFilteredPlatform(tab, source, true);
                    return;
                }
                setFilteredPlatform(tab, source, !checked);
            }}
        >
            <span className="flex h-[22px] flex-row items-center text-medium">
                <SocialSourceIcon source={source} width={15} height={15} className="mr-2 shrink-0" mono />
                {resolveSourceName(source)}
            </span>
            {loginRequest && !isLogin ? (
                <span className="h-5 text-medium leading-5 text-lightHighlight">
                    <Trans>Sign in</Trans>
                </span>
            ) : (
                <CircleCheckboxIcon checked={checked} />
            )}
        </a>
    );
}

export function DiscoverFilter({ tab, source }: Props) {
    const { followingTimelinePlatforms, setFollowingTimelinePlatforms } = useDiscoverStore();
    const sources = useSocialDiscoverSourcesWithWhitelist(tab);

    function getMenuItems() {
        switch (source) {
            case Source.Posts:
                return sources.map((source) => {
                    return (
                        <MenuItem key={source}>
                            {({ close }) => (
                                <PlatformItem
                                    source={source}
                                    tab={tab}
                                    loginRequest={
                                        [HomeTab.Following].includes(tab) ||
                                        SOCIAL_DISCOVER_SOURCE_LOGIN_REQUIRED.includes(source)
                                    }
                                    onClose={close}
                                />
                            )}
                        </MenuItem>
                    );
                });
            case Source.DAOs:
            case Source.NFTs:
            case Source.Polymarket:
            case Source.Article:
                return (
                    [
                        FollowingTimelinePlatform.Lens,
                        FollowingTimelinePlatform.Farcaster,
                        FollowingTimelinePlatform.Twitter,
                        FollowingTimelinePlatform.Wallet,
                    ] as FollowingTimelinePlatform[]
                ).map((platform) => {
                    const checked = followingTimelinePlatforms[source].includes(platform);
                    return (
                        <MenuItem key={platform}>
                            <div
                                className={classNames('flex w-full flex-row items-center justify-between py-1', {
                                    'text-placeholder': !checked,
                                })}
                            >
                                <div className="flex h-[22px] flex-row items-center text-medium">
                                    <FollowingTimelinePlatformIcon platform={platform} />
                                    <FollowingTimelinePlatformText platform={platform} />
                                </div>
                                <Checkbox
                                    onChange={(checked) => setFollowingTimelinePlatforms(source, platform, !checked)}
                                    checked={checked}
                                    className="cursor-pointer"
                                >
                                    <CircleCheckboxIcon checked={checked} />
                                </Checkbox>
                            </div>
                        </MenuItem>
                    );
                });
            case Source.Swap:
                return null;
            default:
                safeUnreachable(source);
                return null;
        }
    }

    return (
        <Menu>
            {({ close }) => (
                <Fragment key="discover-filter">
                    <MenuButton
                        className="size-6 text-placeholder outline-none"
                        onMouseEnter={(e) => e.currentTarget.click()}
                    >
                        <FilterIcon width={24} height={24} />
                    </MenuButton>
                    <MenuItems
                        transition
                        anchor="bottom end"
                        className="z-50 w-[240px] origin-top-right !overflow-visible font-normal outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0"
                        onMouseLeave={() => close()}
                    >
                        <div className="mt-5 w-full -translate-y-5 transform">
                            <div className="flex w-full flex-col gap-2 overflow-y-auto rounded-[8px] bg-primaryBottom p-3 shadow-messageShadow">
                                <div className="flex w-full justify-between py-1">
                                    <span className="text-sm font-bold">
                                        <Trans>Platform filter</Trans>
                                    </span>
                                </div>
                                {getMenuItems()}
                            </div>
                        </div>
                    </MenuItems>
                </Fragment>
            )}
        </Menu>
    );
}
