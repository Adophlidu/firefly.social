import type { ReactNode } from 'react';

import { ComposeWatcher } from '@/components/Compose/ComposeWatcher.js';
import { ComposeButton } from '@/components/ComposeButton/index.js';
import { DefaultRightSidebarContent } from '@/components/DefaultRightSidebarContent.js';
import { IfPathname } from '@/components/IfPathname.js';
import { LinkCloud } from '@/components/LinkCloud.js';
import { NavigatorBar } from '@/components/NavigatorBar/index.js';
import { AsideSearchBar, HeaderSearchBar } from '@/components/Search/SearchBar.js';
import { SearchPredictionFilterSidebar } from '@/components/Search/SearchPredictionFilterSidebar.js';

const parallelSidebarPatterns: Array<`/${string}`> = [
    '/following/trades',
    '/polymarket/event/:id',
    '/token/:symbol',
    '/token/cex/:coin',
    '/token/dex/:chain/:address',
];
interface Props {
    children: ReactNode;
    modal: ReactNode;
    sidebar: ReactNode;
    subnav: ReactNode;
}

export default async function Layout({ children, modal, sidebar, subnav }: Props) {
    return (
        <>
            <main className="flex w-full flex-[1_1_100%] flex-col md:border-r md:border-line md:pl-[235px] lg:w-[888px] lg:max-w-[calc(100%-384px)] lg:pl-[289px]">
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
                            '/nft',
                            '/auth',
                            '/wallet',
                        ]}
                    >
                        <NavigatorBar />
                    </IfPathname>

                    <IfPathname isOneOf={['/search', '/explore']}>
                        <HeaderSearchBar />
                        {subnav}
                    </IfPathname>
                </div>
                {children}
                {modal}
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
                        {sidebar}
                    </IfPathname>
                    <LinkCloud />
                </div>
            </aside>
            <IfPathname isNotOneOf={['/token']}>
                <ComposeButton />
            </IfPathname>
            <ComposeWatcher />
        </>
    );
}
