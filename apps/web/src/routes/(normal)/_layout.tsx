import { Slot } from '@dimensiondev/ssr';
import { classNames } from '@dimensiondev/utils';
import type { ReactNode } from 'react';

import { ComposeWatcher } from '@/components/Compose/ComposeWatcher.js';
import { ComposeButton } from '@/components/ComposeButton/index.js';
import { DefaultRightSidebarContent } from '@/components/DefaultRightSidebarContent.js';
import { LinkCloud } from '@/components/LinkCloud.js';
import { NavigatorBar } from '@/components/NavigatorBar/index.js';
import { AsideSearchBar } from '@/components/Search/SearchBar.js';
import { SideBar } from '@/components/SideBar/index.js';

// Left offset that clears the fixed navigation sidebar; shared by every main content column.
const SIDEBAR_OFFSET = 'md:pl-[235px] lg:pl-[289px]';

/**
 * The (normal) group frame — the old src/app/[locale]/(normal)/layout.tsx:
 * centered main column with a sticky top bar, right search/widget aside,
 * left nav sidebar, and compose affordances. Pages customize regions through
 * slots instead of pathname checks:
 *
 * - `topnav`  — replaces NavigatorBar (post detail / profile / token / auth /
 *   event pages export `() => null` and render their own headers)
 * - `subnav`  — under the top bar (explore/search render their tab bars here)
 * - `sidebar` — replaces the right widget column (export `() => null` on
 *   pages that manage their own)
 * - `compose` — replaces ComposeButton (token/messages export `() => null`)
 */
export default function NormalGroupLayout({ children }: { children?: ReactNode }) {
    return (
        <div className="m-auto flex w-full md:min-h-screen lg:w-[1265px]">
            <main
                className={classNames(
                    'flex w-full flex-[1_1_100%] flex-col md:border-r md:border-line lg:w-[888px] lg:max-w-[calc(100%-384px)]',
                    SIDEBAR_OFFSET,
                )}
            >
                <div className="sticky top-0 z-40 bg-primaryBottom">
                    <Slot name="topnav" fallback={<NavigatorBar />} />
                    <Slot name="subnav" />
                </div>
                {children}
            </main>
            <aside className="sticky top-0 z-1 hidden h-screen w-96 flex-col px-4 md:min-w-[384px] lg:flex">
                <AsideSearchBar />
                <div className="no-scrollbar flex flex-1 flex-col gap-4 overflow-auto">
                    <Slot name="sidebar" fallback={<DefaultRightSidebarContent />} />
                    <LinkCloud />
                </div>
            </aside>
            <SideBar />
            <Slot name="compose" fallback={<ComposeButton />} />
            <ComposeWatcher />
        </div>
    );
}
