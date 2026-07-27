import { ExploreType, type ExploreSourceInURL } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import type { ReactNode } from 'react';

import { ComposeWatcher } from '@/components/Compose/ComposeWatcher.js';
import { ComposeButton } from '@/components/ComposeButton/index.js';
import { DefaultRightSidebarContent } from '@/components/DefaultRightSidebarContent.js';
import { ExploreSourceTabs } from '@/components/Explores/ExploreSourceTabs.js';
import { HomeTabs } from '@/components/HomeTab/index.js';
import { IfPathname } from '@/components/IfPathname.js';
import { LinkCloud } from '@/components/LinkCloud.js';
import { NavigatorBar } from '@/components/NavigatorBar/index.js';
import { NoSSR } from '@/components/NoSSR.js';
import { ClubTypeTab } from '@/components/Search/CommunityTypeTab.js';
import { AsideSearchBar, HeaderSearchBar } from '@/components/Search/SearchBar.js';
import { SearchPredictionFilterSidebar } from '@/components/Search/SearchPredictionFilterSidebar.js';
import { SearchSources } from '@/components/Search/SearchSources.js';
import { SearchTabs } from '@/components/Search/SearchTabs.js';
import { ExploreSourceNav } from '@/components/SourceNav/ExploreSourceNav.js';
import { PredictionSourceNav } from '@/components/SourceNav/PredictionSourceNav.js';
import { usePathname } from '@/esm/navigation.js';

// Left offset that clears the fixed navigation sidebar; shared by every main content column.
const SIDEBAR_OFFSET = 'md:pl-[235px] lg:pl-[289px]';

const parallelSidebarPatterns: Array<`/${string}`> = [
    '/following/trades',
    '/polymarket/event/:id',
    '/token/:symbol',
    '/token/cex/:coin',
    '/token/dex/:chain/:address',
];

// Pages that render the home tabs above their content — the old (home) group:
// (discover) posts/activities/prediction/world-cup-feed (exact) + following/*.
// Exact matching matters: /prediction/category/* and /prediction/leaderboard
// are NOT home pages even though they share the prefix.
const HOME_TAB_EXACT_PATHS: Array<`/${string}`> = ['/posts', '/activities', '/prediction', '/world-cup-feed'];
const HOME_TAB_PREFIX_PATHS: Array<`/${string}`> = ['/following'];

function HomeTabsFrame({ children }: { children?: ReactNode }) {
    return (
        <div className="flex w-full flex-col">
            <HomeTabs />
            {children}
        </div>
    );
}

/**
 * The explore sub-navigation (the old @subnav parallel route): explore type
 * tabs plus the per-type source nav, driven by the current pathname.
 */
function ExploreSubnav() {
    const pathname = usePathname();
    const [, , explore, source] = pathname.split('/');
    if (!explore) return null;
    return (
        <>
            <ExploreSourceTabs explore={explore as ExploreType} />
            {explore === ExploreType.Prediction ? (
                <PredictionSourceNav className="bg-primaryBottom" />
            ) : source ? (
                <ExploreSourceNav
                    explore={explore as ExploreType}
                    source={source as ExploreSourceInURL}
                    className="bg-primaryBottom"
                />
            ) : null}
        </>
    );
}

/** The search sub-navigation (the old @subnav/search parallel route). */
function SearchSubnav() {
    return (
        <>
            <SearchTabs />
            <ClubTypeTab />
            <SearchSources />
        </>
    );
}

/**
 * Port of the Next (normal) group layout
 * (src/app/[locale]/(normal)/layout.tsx + (home)/layout.tsx): the centered
 * main column with the sticky NavigatorBar, the right search/widget aside,
 * and the compose affordances. The @modal/@sidebar/@subnav parallel-route
 * slots are rendered as null for now — their pages fall back to the default
 * content (batch 3 redesigns parallel routes for the SSR library).
 */
export function NormalLayoutBody({ children }: { children?: ReactNode }) {
    return (
        <>
            <IfPathname isOneOf={['/messages']}>
                <main className={classNames('w-full', SIDEBAR_OFFSET)}>{children}</main>
            </IfPathname>
            <IfPathname isNotOneOf={['/messages']}>
                <main
                    className={classNames(
                        'flex w-full flex-[1_1_100%] flex-col md:border-r md:border-line lg:w-[888px] lg:max-w-[calc(100%-384px)]',
                        SIDEBAR_OFFSET,
                    )}
                >
                    <div className="sticky top-0 z-40 bg-primaryBottom">
                        <IfPathname
                            isNotOneOf={[
                                {
                                    r: '^/post/[^/]+$',
                                    flags: 'i',
                                },
                                {
                                    r: '^/post/[^/]+/\\w+$',
                                    flags: 'i',
                                },
                                {
                                    r: '^/article/[^/]+$',
                                    flags: 'i',
                                },
                                '/profile',
                                '/community',
                                '/polymarket/event',
                                '/opinion/event',
                                '/token',
                                '/auth',
                                '/wallet',
                            ]}
                        >
                            <NavigatorBar />
                        </IfPathname>

                        <IfPathname isOneOf={['/search', '/explore']}>
                            <HeaderSearchBar />
                            <IfPathname isOneOf={['/explore']}>
                                <ExploreSubnav />
                            </IfPathname>
                            <IfPathname isOneOf={['/search']}>
                                <SearchSubnav />
                            </IfPathname>
                        </IfPathname>
                    </div>
                    <IfPathname exact isOneOf={HOME_TAB_EXACT_PATHS}>
                        <HomeTabsFrame>{children}</HomeTabsFrame>
                    </IfPathname>
                    <IfPathname exact isNotOneOf={HOME_TAB_EXACT_PATHS}>
                        <IfPathname isOneOf={HOME_TAB_PREFIX_PATHS}>
                            <HomeTabsFrame>{children}</HomeTabsFrame>
                        </IfPathname>
                        <IfPathname isNotOneOf={HOME_TAB_PREFIX_PATHS}>{children}</IfPathname>
                    </IfPathname>
                </main>
                <aside className="sticky top-0 z-1 hidden h-screen w-96 flex-col px-4 md:min-w-[384px] lg:flex">
                    <AsideSearchBar />

                    <div className="no-scrollbar flex flex-1 flex-col gap-4 overflow-auto">
                        <IfPathname
                            isOneOf={parallelSidebarPatterns}
                            otherwise={
                                <IfPathname
                                    exact
                                    isOneOf={['/search/prediction']}
                                    otherwise={<DefaultRightSidebarContent />}
                                >
                                    <SearchPredictionFilterSidebar />
                                </IfPathname>
                            }
                        >
                            {/* @sidebar parallel slot renders null by default */}
                            {null}
                        </IfPathname>
                        <LinkCloud />
                    </div>
                </aside>
            </IfPathname>
            <IfPathname isNotOneOf={['/token', '/messages']}>
                <ComposeButton />
            </IfPathname>
            <ComposeWatcher />
        </>
    );
}
