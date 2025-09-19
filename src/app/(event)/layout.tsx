import { msg } from '@lingui/core/macro';
import { headers } from 'next/headers.js';

import { IfPathname } from '@/components/IfPathname.js';
import { LinkCloud } from '@/components/LinkCloud.js';
import { NavigatorBar } from '@/components/NavigatorBar/index.js';
import { AsideSearchBar, HeaderSearchBar } from '@/components/Search/SearchBar.js';
import { SideBar } from '@/components/SideBar/index.js';
import { SuggestedChannels } from '@/components/SuggestedChannels/SuggestedChannels.js';
import { SuggestedFollows } from '@/components/SuggestedFollows/SuggestedFollows.js';
import { Agent, PageRoute } from '@/constants/enum.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isValidEnumValue } from '@/helpers/isValidEnumValue.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import type { NextPageProps } from '@/types/utility.js';
import { getAgent } from '@/helpers/getAgent.js';

interface Props
    extends NextPageProps<
        never,
        {
            agent: string;
        }
    > {}

export async function generateMetadata() {
    return createSiteMetadata('/events', {
        title: await createPageTitleSSR(msg`Exclusive Events`),
    });
}

export default async function Layout(props: Props) {
    await setupLocaleForSSR();

    const agent = await getAgent();
    const resolvedAgent = agent && isValidEnumValue(agent, Agent) ? agent : Agent.Browser;

    switch (resolvedAgent) {
        case Agent.FireflyApp:
            return props.children;
        case Agent.Browser:
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
                        {props.children}
                    </main>
                    <aside className="sticky top-0 z-[1] hidden h-screen w-96 flex-col gap-4 px-4 md:min-w-[384px] lg:flex">
                        <div className="no-scrollbar flex flex-1 flex-col gap-4 overflow-auto">
                            <AsideSearchBar />
                            <SuggestedFollows />
                            <SuggestedChannels />
                            <LinkCloud />
                        </div>
                    </aside>
                </>
            );
        case Agent.FarcasterFrame:
            return null;
        default:
            return null;
    }
}
