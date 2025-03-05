'use client';

import { Checkbox, Menu, MenuItem } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { safeUnreachable } from '@masknet/kit';

import FilterIcon from '@/assets/filter.svg';
import WalletIcon from '@/assets/wallet.svg';
import { CircleCheckboxIcon } from '@/components/CircleCheckboxIcon.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { type FollowingSource, HomeTab, Source } from '@/constants/enum.js';
import { SOCIAL_DISCOVER_SOURCE } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
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

export function DiscoverFilter({ tab, source }: Props) {
    const { postTimelinePlatforms, followingTimelinePlatforms, setFilteredPlatform, setFollowingTimelinePlatforms } =
        useDiscoverStore();
    function getMenuItems() {
        switch (source) {
            case Source.Posts:
                return SOCIAL_DISCOVER_SOURCE.map((source) => {
                    const checked = postTimelinePlatforms[tab].includes(source);
                    return (
                        <MenuItem key={source}>
                            <div
                                className={classNames('flex w-full flex-row items-center justify-between py-1', {
                                    'text-placeholder': !checked,
                                })}
                            >
                                <div className="flex h-[22px] flex-row items-center text-medium">
                                    <SocialSourceIcon
                                        source={source}
                                        width={15}
                                        height={15}
                                        className="mr-2 shrink-0"
                                        mono
                                    />
                                    {resolveSourceName(source)}
                                </div>
                                <Checkbox
                                    onChange={(checked) => setFilteredPlatform(tab, source, !checked)}
                                    checked={checked}
                                    className="cursor-pointer"
                                >
                                    <CircleCheckboxIcon checked={checked} />
                                </Checkbox>
                            </div>
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
            default:
                safeUnreachable(source);
                return null;
        }
    }

    return (
        <Menu>
            <Menu.Button className="h-5 w-5 text-placeholder">
                <FilterIcon width={20} height={20} />
            </Menu.Button>
            <Menu.Items
                transition
                anchor="bottom end"
                className="z-50 flex w-[240px] origin-top-right flex-col gap-2 overflow-y-auto rounded-[8px] bg-primaryBottom p-3 font-normal shadow-messageShadow transition data-[closed]:scale-95 data-[closed]:opacity-0"
            >
                <div className="flex w-full justify-between py-1">
                    <span className="text-sm font-bold">Platform filter</span>
                </div>
                {getMenuItems()}
            </Menu.Items>
        </Menu>
    );
}
