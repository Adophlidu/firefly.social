'use client';

import { Trans } from '@lingui/react/macro';
import { getEnumAsArray } from '@masknet/kit';
import { usePathname } from 'next/navigation.js';
import { useMemo } from 'react';

import { SourceTabs } from '@/components/SourceTabs/index.js';
import { SourceTab } from '@/components/SourceTabs/SourceTab.js';
import { SolidTabs } from '@/components/Tabs/SolidTabs.js';
import { HomeTab, Source } from '@/constants/enum.js';
import { parseDiscoverPageUrl } from '@/helpers/parseDiscoverPageUrl.js';
import { parseFollowingPageUrl } from '@/helpers/parseFollowingPageUrl.js';
import { resolveHomeUrl } from '@/helpers/resolveHomeUrl.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';

const types = {
    [HomeTab.Discover]: [Source.Posts, Source.NFTs, Source.Article, Source.DAOs],
    [HomeTab.Following]: [Source.Posts, Source.Polymarket, Source.NFTs, Source.Article, Source.DAOs],
};

export function HomeTabs() {
    const pathname = usePathname();
    const { tab: currentTab, source } = useMemo(() => {
        const parsedFollowingPageUrl = parseFollowingPageUrl(pathname);
        if (parsedFollowingPageUrl) {
            return {
                source: parsedFollowingPageUrl.source,
                tab: HomeTab.Following,
            };
        }
        const parsedHomePageUrl = parseDiscoverPageUrl(pathname);
        if (parsedHomePageUrl) {
            return {
                source: parsedHomePageUrl.source,
                tab: HomeTab.Discover,
            };
        }
        return {
            tab: HomeTab.Discover,
            source: Source.Posts,
        };
    }, [pathname]);

    return (
        <>
            <SourceTabs className="sticky top-0">
                {getEnumAsArray(HomeTab).map(({ value: tab }) => {
                    const type = types[tab].includes(source) ? source : types[tab][0];
                    return (
                        <SourceTab key={tab} href={resolveHomeUrl(tab, type)} isActive={tab === currentTab}>
                            {
                                {
                                    [HomeTab.Discover]: <Trans>Discover</Trans>,
                                    [HomeTab.Following]: <Trans>Following</Trans>,
                                }[tab]
                            }
                        </SourceTab>
                    );
                })}
            </SourceTabs>
            <div className="w-full px-4 py-3">
                <SolidTabs<Source>
                    data={types[currentTab]}
                    link={(x) => resolveHomeUrl(currentTab, x)}
                    isSelected={(x) => x === source}
                    itemRender={(x) => resolveSourceName(x)}
                />
            </div>
        </>
    );
}
