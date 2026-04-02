'use client';

import { type ReactNode } from 'react';

import { useAgent } from '@/components/AgentProvider.js';
import { IfPathname } from '@/components/IfPathname.js';
import { LinkCloud } from '@/components/LinkCloud.js';
import { NavigatorBar } from '@/components/NavigatorBar/index.js';
import { AsideSearchBar, HeaderSearchBar } from '@/components/Search/SearchBar.js';
import { SideBar } from '@/components/SideBar/index.js';
import { SuggestedChannels } from '@/components/SuggestedChannels/SuggestedChannels.js';
import { SuggestedFollows } from '@/components/SuggestedFollows/SuggestedFollows.js';
import { Agent, PageRoute } from '@/constants/enum.js';

export function EventLayoutBody({ children }: { children: ReactNode }) {
    const agent = useAgent();

    if (agent === Agent.FireflyApp) {
        return <>{children}</>;
    }

    if (agent === Agent.FarcasterFrame) {
        return null;
    }

    return (
        <>
            <SideBar />
            <main className="flex w-full flex-[1_1_100%] flex-col md:border-r md:border-line md:pl-[235px] lg:w-[888px] lg:max-w-[calc(100%-384px)] lg:pl-[289px]">
                <div className="sticky top-0 z-40 bg-primaryBottom">
                    <HeaderSearchBar />
                    <IfPathname isOneOf={[PageRoute.Events]}>
                        <NavigatorBar />
                    </IfPathname>
                </div>
                {children}
            </main>
            <aside className="sticky top-0 z-1 hidden h-full w-96 flex-col gap-4 px-4 md:min-w-[384px] lg:flex">
                <div className="no-scrollbar flex flex-1 flex-col gap-4 overflow-auto">
                    <AsideSearchBar />
                    <SuggestedFollows />
                    <SuggestedChannels />
                    <LinkCloud />
                </div>
            </aside>
        </>
    );
}
