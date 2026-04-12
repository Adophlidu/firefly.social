import type { ReactNode } from 'react';

import { Advertisement } from '@/components/Advertisement/index.js';
import { Calendar } from '@/components/Calendar/Calendar.js';
import { ComposeWatcher } from '@/components/Compose/ComposeWatcher.js';
import { ComposeButton } from '@/components/ComposeButton/index.js';
import { IfPathname } from '@/components/IfPathname.js';
import { LinkCloud } from '@/components/LinkCloud.js';
import { NavigatorBar } from '@/components/NavigatorBar/index.js';
import { AsideSearchBar, HeaderSearchBar } from '@/components/Search/SearchBar.js';
import { Section } from '@/components/Semantic/Section.js';
import { SuggestedChannels } from '@/components/SuggestedChannels/SuggestedChannels.js';
import { SuggestedFollows } from '@/components/SuggestedFollows/SuggestedFollows.js';
import { WithinDiscover } from '@/components/WithinDiscover.js';

const parallelSidebarPatterns: Array<`/${string}`> = [
    '/following/trades',
    '/token/:symbol',
    '/token/cex/:coin',
    '/token/dex/:chain/:address',
];
interface Props {
    children: ReactNode;
    modal: ReactNode;
    sidebar: ReactNode;
}

export default async function Layout({ children, modal, sidebar }: Props) {
    return (
        <>
            <main className="md:border-line flex w-full flex-[1_1_100%] flex-col md:border-r md:pl-[235px] lg:w-[888px] lg:max-w-[calc(100%-384px)] lg:pl-[289px]">
                <div className="bg-primaryBottom sticky top-0 z-40">
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
                            '/token',
                            '/nft',
                            '/auth',
                            '/wallet',
                        ]}
                    >
                        <NavigatorBar />
                    </IfPathname>

                    <HeaderSearchBar />
                </div>
                {children}
                {modal}
            </main>
            <aside className="z-1 sticky top-0 hidden h-screen w-96 flex-col px-4 md:min-w-[384px] lg:flex">
                <AsideSearchBar />

                <div className="no-scrollbar flex flex-1 flex-col gap-4 overflow-auto">
                    <IfPathname
                        isOneOf={parallelSidebarPatterns}
                        otherwise={
                            <>
                                <Section title="Advertisement" className="mt-[26px]">
                                    <Advertisement />
                                </Section>
                                <WithinDiscover
                                    otherwise={
                                        <>
                                            <SuggestedFollows />
                                            <SuggestedChannels />
                                        </>
                                    }
                                >
                                    <Section title="Web3 Calendar">
                                        <Calendar />
                                    </Section>
                                </WithinDiscover>
                            </>
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
