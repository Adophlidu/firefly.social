import { Suspense } from 'react';

import { DefaultRightSidebarContent } from '@/components/DefaultRightSidebarContent.js';
import { LinkCloud } from '@/components/LinkCloud.js';
import { AsideSearchBar } from '@/components/Search/SearchBar.js';

export function DefaultRightSidebar() {
    return (
        <aside className="sticky top-0 z-1 hidden h-screen w-96 flex-col px-4 md:min-w-[384px] lg:flex">
            <Suspense>
                <AsideSearchBar />
                <div className="no-scrollbar flex flex-1 flex-col gap-4 overflow-auto">
                    <DefaultRightSidebarContent />
                    <LinkCloud />
                </div>
            </Suspense>
        </aside>
    );
}
