import type { ReactNode } from 'react';

import { ClubTypeTab } from '@/components/Search/CommunityTypeTab.js';
import { HeaderSearchBar } from '@/components/Search/SearchBar.js';
import { SearchSources } from '@/components/Search/SearchSources.js';
import { SearchTabs } from '@/components/Search/SearchTabs.js';

/** The search sub-navigation (the old @subnav/search parallel route). */
export function subnav() {
    return (
        <>
            <HeaderSearchBar />
            <SearchTabs />
            <ClubTypeTab />
            <SearchSources />
        </>
    );
}

export default function SearchLayout({ children }: { children?: ReactNode }) {
    return <>{children}</>;
}
