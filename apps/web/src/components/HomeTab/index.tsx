'use client';

import ArrowDownCircleIcon from '@dimensiondev/assets/arrow-circle-down.svg';
import { classNames, getEnumAsArray } from '@dimensiondev/utils';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { useMemo, useRef } from 'react';

import { ActivitiesFilter } from '@/components/HomeTab/ActivitiesFilter.js';
import { DiscoverFilter } from '@/components/HomeTab/DiscoverFilter.js';
import { Link } from '@/components/Link.js';
import { PredictionPlatformFilter } from '@/components/Prediction/PredictionPlatformFilter.js';
import { ChainFilter } from '@/components/Swap/ChainFilter.js';
import { SolidTabs } from '@/components/Tabs/SolidTabs.js';
import { HomeTab, NetworkType, Source } from '@/constants/enum.js';
import { NFT_ENABLED } from '@/constants/static.js';
import { usePathname } from '@/esm/navigation.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { parseDiscoverPageUrl } from '@/helpers/parseDiscoverPageUrl.js';
import { parseFollowingPageUrl } from '@/helpers/parseFollowingPageUrl.js';
import { resolveHomeUrl } from '@/helpers/resolveHomeUrl.js';
import { resolveSourceUIName } from '@/helpers/resolveSourceName.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { ActivitiesFilterNamespace } from '@/store/useActivitiesFilterStore.js';
import { PredictionFilterNamespace } from '@/store/usePredictionSourceFilterStore.js';
import { useTransactionsStateStore } from '@/store/useTransactionsStore.js';

const types = {
    [HomeTab.Discover]: NFT_ENABLED
        ? [Source.Posts, Source.Transactions, Source.Prediction, Source.Activities]
        : [Source.Posts, Source.Prediction, Source.Activities],
    [HomeTab.Following]: [Source.Posts, Source.Transactions, Source.Prediction, Source.Activities],
};
const tabLabels = {
    [HomeTab.Discover]: <Trans>For you</Trans>,
    [HomeTab.Following]: <Trans>Following</Trans>,
};

function resolveHomeTabEventId(tab: HomeTab, source: Source): EventId | null {
    if (tab === HomeTab.Following) {
        switch (source) {
            case Source.Posts:
                return EventId.EVENT_FOLLOWING_POSTS_CLICK;
            case Source.Transactions:
                return EventId.EVENT_FOLLOWING_SWAP_CLICK;
            case Source.Prediction:
                return EventId.EVENT_FOLLOWING_PREDICTIONS_CLICK;
            case Source.Activities:
                return EventId.EVENT_FOLLOWING_ACTIVITIES_CLICK;
            default:
                return null;
        }
    } else {
        switch (source) {
            case Source.Posts:
                return EventId.EVENT_FOR_YOU_POSTS_CLICK;
            case Source.Transactions:
                return EventId.EVENT_FOR_YOU_SWAP_CLICK;
            case Source.Prediction:
                return EventId.EVENT_FOR_YOU_PREDICTIONS_CLICK;
            case Source.Activities:
                return EventId.EVENT_FOR_YOU_ACTIVITIES_CLICK;
            default:
                return null;
        }
    }
}

export function HomeTabs({
    onlyFilter = false,
    buttonClass,
    containerClass,
}: {
    onlyFilter?: boolean;
    buttonClass?: string;
    containerClass?: string;
}) {
    const pathname = usePathname();
    const stablePathnameRef = useRef(
        !isRoutePathname(pathname, '/post/:source/:id/photos/:index', true) ? pathname : '',
    );
    if (!isRoutePathname(pathname, '/post/:source/:id/photos/:index', true)) {
        stablePathnameRef.current = pathname;
    }
    const stablePathname = stablePathnameRef.current;

    const { hasOpenSwap, setHasOpenSwap } = useTransactionsStateStore(NetworkType.Ethereum);
    const { tab: currentTab, source } = useMemo(() => {
        const parsedFollowingPageUrl = parseFollowingPageUrl(stablePathname);
        if (parsedFollowingPageUrl) {
            return {
                source: parsedFollowingPageUrl.source,
                tab: HomeTab.Following,
            } as const;
        }
        const parsedHomePageUrl = parseDiscoverPageUrl(stablePathname);
        if (parsedHomePageUrl) {
            return {
                source: parsedHomePageUrl.source,
                tab: HomeTab.Discover,
            } as const;
        }
        return {
            tab: HomeTab.Discover,
            source: Source.Posts,
        } as const;
    }, [stablePathname]);
    const isLogin = useIsLoginFirefly();

    const isFollowingTab = currentTab === HomeTab.Following;

    return (
        <div className="bg-primaryBottom sticky top-[54px] z-30 flex w-full flex-col md:top-0">
            <div className={!onlyFilter ? 'max-md:hidden' : ''}>
                {!isLogin && currentTab === HomeTab.Discover ? (
                    <div className={classNames('flex h-[60px] flex-col px-4 pt-2.5', containerClass)}>
                        <div className="h-[50px] text-xl font-bold leading-[50px]">
                            <Trans>Home</Trans>
                        </div>
                    </div>
                ) : (
                    <div
                        className={classNames(
                            'flex h-[60px] flex-col px-4 max-md:items-center md:pt-2.5',
                            containerClass,
                        )}
                    >
                        <Menu>
                            {({ close }) => (
                                <div>
                                    <MenuButton
                                        className={classNames(
                                            'mr-auto inline-flex h-full items-center text-xl font-bold',
                                            buttonClass,
                                        )}
                                        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) =>
                                            e.currentTarget.click()
                                        }
                                    >
                                        {tabLabels[currentTab]}
                                        <ArrowDownCircleIcon width={24} height={24} className="ml-2 size-6 shrink-0" />
                                    </MenuButton>
                                    <MenuItems
                                        onMouseLeave={() => close()}
                                        transition
                                        anchor="bottom start"
                                        className="z-50 w-[128px] origin-top-left !overflow-visible text-xl font-bold outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0"
                                    >
                                        <div className="w-full translate-y-[-50px] pt-[50px]">
                                            <div className="bg-primaryBottom shadow-messageShadow flex w-full flex-col gap-2 overflow-y-auto rounded-[8px] py-3">
                                                {getEnumAsArray(HomeTab).map(({ value: tab }) => {
                                                    const type =
                                                        types[tab].includes(source) && tab !== currentTab
                                                            ? source
                                                            : types[tab][0];
                                                    return (
                                                        <MenuItem key={tab}>
                                                            <Link
                                                                href={resolveHomeUrl(tab, type)}
                                                                className={classNames('px-3 py-1 hover:opacity-100', {
                                                                    'opacity-60': currentTab !== tab,
                                                                })}
                                                            >
                                                                {tabLabels[tab]}
                                                            </Link>
                                                        </MenuItem>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </MenuItems>
                                </div>
                            )}
                        </Menu>
                    </div>
                )}
            </div>

            {!onlyFilter ? (
                <div className="flex w-full items-center justify-between px-4 pb-3 max-md:mt-1">
                    <SolidTabs<Source>
                        data={types[currentTab]}
                        link={(x) => resolveHomeUrl(currentTab, x)}
                        isSelected={(x) => x === source}
                        // eslint-disable-next-line react/no-unstable-nested-components
                        itemRender={(x) => {
                            if (x === Source.Swap && !hasOpenSwap) {
                                return (
                                    <span className="relative">
                                        {resolveSourceUIName(x)}
                                        <span className="bg-danger absolute -top-2 right-[-18px] rounded-full px-1 py-0.5 text-[9px] leading-[9px] text-white">
                                            <Trans>New</Trans>
                                        </span>
                                    </span>
                                );
                            }

                            return resolveSourceUIName(x);
                        }}
                        onChange={(source) => {
                            const eventId = resolveHomeTabEventId(currentTab, source);
                            if (eventId) {
                                TelemetryProvider.captureEvent(eventId, {} as never);
                            }

                            if (source === Source.Transactions && !hasOpenSwap) {
                                setHasOpenSwap(true);
                            }
                        }}
                    />
                    {source === Source.Posts ? (
                        <DiscoverFilter tab={currentTab} />
                    ) : source === Source.Transactions ? (
                        <ChainFilter
                            networkType={currentTab === HomeTab.Following ? undefined : NetworkType.Ethereum}
                        />
                    ) : source === Source.Activities ? (
                        <ActivitiesFilter namespace={ActivitiesFilterNamespace.Home} hasMatters={!isFollowingTab} />
                    ) : source === Source.Prediction ? (
                        <PredictionPlatformFilter
                            namespace={
                                isFollowingTab
                                    ? PredictionFilterNamespace.Following
                                    : PredictionFilterNamespace.Discover
                            }
                        />
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
