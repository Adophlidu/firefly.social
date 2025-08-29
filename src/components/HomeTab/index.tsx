'use client';

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { type ReactNode, useMemo, useState } from 'react';

import ArrowDownCircleIcon from '@/assets/arrow-circle-down.svg';
import { ActivitiesFilter } from '@/components/HomeTab/ActivitiesFilter.js';
import { DiscoverFilter } from '@/components/HomeTab/DiscoverFilter.js';
import { Link } from '@/components/Link.js';
import { ChainFilter } from '@/components/Swap/ChainFilter.js';
import { SolidTabs } from '@/components/Tabs/SolidTabs.js';
import { TypeFilter } from '@/components/TypeFilter/index.js';
import { HomeTab, NetworkType, Source } from '@/constants/enum.js';
import { usePathname } from '@/esm/navigation.js';
import { classNames } from '@/helpers/classNames.js';
import { getEnumAsArray } from '@/helpers/getEnumAsArray.js';
import { parseDiscoverPageUrl } from '@/helpers/parseDiscoverPageUrl.js';
import { parseFollowingPageUrl } from '@/helpers/parseFollowingPageUrl.js';
import { resolveHomeUrl } from '@/helpers/resolveHomeUrl.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { captureSwapEvent } from '@/providers/telemetry/captureSwapEvent.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { ActivitiesFilterNamespace } from '@/store/useActivitiesFilterStore.js';
import { useTransactionsStateStore } from '@/store/useTransactionsStore.js';

const types = {
    [HomeTab.Discover]: [Source.Posts, Source.Transactions, Source.Activities],
    [HomeTab.Following]: [Source.Posts, Source.Transactions, Source.Activities],
};
const tabLabels = {
    [HomeTab.Discover]: <Trans>For You</Trans>,
    [HomeTab.Following]: <Trans>Following</Trans>,
};

const txTypeOptions: Array<{ value: string; label: ReactNode }> = [
    {
        value: Source.Polymarket,
        label: <Trans>Polymarket bet</Trans>,
    },
    {
        value: Source.Swap,
        label: <Trans>Token</Trans>,
    },
];

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
    const { hasOpenSwap, setHasOpenSwap, followingTxTypes, setFollowingTxTypes } = useTransactionsStateStore(
        NetworkType.Ethereum,
    );
    const [allTabs, setAllTabs] = useState<Record<HomeTab, Source>>({
        [HomeTab.Discover]: types[HomeTab.Discover][0],
        [HomeTab.Following]: types[HomeTab.Following][0],
    });
    const { tab: currentTab, source } = useMemo(() => {
        const parsedFollowingPageUrl = parseFollowingPageUrl(pathname);
        if (parsedFollowingPageUrl) {
            return {
                source: parsedFollowingPageUrl.source,
                tab: HomeTab.Following,
            } as const;
        }
        const parsedHomePageUrl = parseDiscoverPageUrl(pathname);
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
    }, [pathname]);
    const isLogin = useIsLoginFirefly();

    const isFollowingTab = currentTab === HomeTab.Following;

    return (
        <div className="sticky top-[54px] z-20 flex w-full flex-col bg-primaryBottom md:top-0">
            <div className={!onlyFilter ? 'max-md:hidden' : ''}>
                {!isLogin && currentTab === HomeTab.Discover ? (
                    <div className={classNames('flex h-[60px] flex-col px-4 pt-2.5', containerClass)}>
                        <div className="h-[50px] text-xl font-bold leading-[50px]">
                            <Trans>Home</Trans>
                        </div>
                    </div>
                ) : (
                    <div className={classNames('flex h-[60px] flex-col px-4 pt-2.5', containerClass)}>
                        <Menu>
                            {({ close }) => (
                                <div>
                                    <MenuButton
                                        className={classNames(
                                            'mr-auto inline-flex h-full items-center text-xl font-bold',
                                            buttonClass,
                                        )}
                                        onMouseEnter={(e) => e.currentTarget.click()}
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
                                        <div className="w-full -translate-y-[50px] transform pt-[50px]">
                                            <div className="flex w-full flex-col gap-2 overflow-y-auto rounded-[8px] bg-primaryBottom py-3 shadow-messageShadow">
                                                {getEnumAsArray(HomeTab).map(({ value: tab }) => {
                                                    const type = types[tab].includes(allTabs[tab])
                                                        ? allTabs[tab]
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
                                        {resolveSourceName(x)}
                                        <span className="absolute -right-[18px] -top-2 rounded-full bg-danger px-1 py-0.5 text-[9px] leading-[9px] text-white">
                                            <Trans>New</Trans>
                                        </span>
                                    </span>
                                );
                            }

                            return resolveSourceName(x);
                        }}
                        onChange={(source) => {
                            if (source === Source.Swap) {
                                if (!hasOpenSwap) setHasOpenSwap(true);
                                captureSwapEvent(EventId.EVENT_FOLLOWING_SWAP_CLICK);
                            }
                            setAllTabs((x) => ({
                                ...x,
                                [currentTab]: source,
                            }));
                        }}
                    />
                    {source === Source.Posts ? (
                        <DiscoverFilter tab={currentTab} />
                    ) : source === Source.Transactions ? (
                        <ChainFilter networkType={currentTab === HomeTab.Following ? undefined : NetworkType.Ethereum}>
                            {isFollowingTab ? (
                                <TypeFilter
                                    multiple
                                    options={txTypeOptions}
                                    selectedOptions={followingTxTypes}
                                    onOptionsChange={setFollowingTxTypes}
                                />
                            ) : null}
                        </ChainFilter>
                    ) : source === Source.Activities ? (
                        <ActivitiesFilter namespace={ActivitiesFilterNamespace.Home} />
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
