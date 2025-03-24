'use client';

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { getEnumAsArray } from '@masknet/kit';
import { usePathname } from 'next/navigation.js';
import { useMemo, useState } from 'react';

import ArrowDownCircleIcon from '@/assets/arrow-circle-down.svg';
import { DiscoverFilter } from '@/components/HomeTab/DiscoverFilter.js';
import { Link } from '@/components/Link.js';
import { SolidTabs } from '@/components/Tabs/SolidTabs.js';
import { HomeTab, Source } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { parseDiscoverPageUrl } from '@/helpers/parseDiscoverPageUrl.js';
import { parseFollowingPageUrl } from '@/helpers/parseFollowingPageUrl.js';
import { resolveHomeUrl } from '@/helpers/resolveHomeUrl.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useIsLoginDiscoverSource } from '@/hooks/useIsLogin.js';

const types = {
    [HomeTab.Discover]: [Source.Posts, Source.NFTs, Source.Article, Source.DAOs],
    [HomeTab.Following]: [Source.Posts, Source.Polymarket, Source.NFTs, Source.Article, Source.DAOs],
};

export function HomeTabs() {
    const pathname = usePathname();
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
    const isLogin = useIsLoginDiscoverSource();

    const texts = {
        [HomeTab.Discover]: <Trans>For You</Trans>,
        [HomeTab.Following]: <Trans>Following</Trans>,
    };

    return (
        <div className="sticky top-[54px] z-20 flex w-full flex-col bg-primaryBottom md:top-0">
            {!isLogin && currentTab === HomeTab.Discover ? (
                <div className="flex h-[60px] flex-col px-4 pt-2.5">
                    <div className="h-[50px] text-xl font-bold leading-[50px]">
                        <Trans>Home</Trans>
                    </div>
                </div>
            ) : (
                <div className="flex h-[60px] flex-col px-4 pt-2.5">
                    <Menu>
                        {({ close }) => (
                            <>
                                <MenuButton
                                    className="mr-auto inline-flex h-full items-center text-xl font-bold"
                                    onMouseEnter={(e) => e.currentTarget.click()}
                                >
                                    {texts[currentTab]}
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
                                                            {texts[tab]}
                                                        </Link>
                                                    </MenuItem>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </MenuItems>
                            </>
                        )}
                    </Menu>
                </div>
            )}

            <div className="flex w-full items-center justify-between px-4 pb-3">
                <SolidTabs<Source>
                    data={types[currentTab]}
                    link={(x) => resolveHomeUrl(currentTab, x)}
                    isSelected={(x) => x === source}
                    itemRender={(x) => resolveSourceName(x)}
                    onChange={(source) => {
                        setAllTabs((x) => ({
                            ...x,
                            [currentTab]: source,
                        }));
                    }}
                />
                {source === Source.Posts ? <DiscoverFilter tab={currentTab} source={source} /> : null}
            </div>
        </div>
    );
}
