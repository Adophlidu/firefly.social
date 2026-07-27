import type { ReactNode } from 'react';

import { ExploreSourceTabs } from '@/components/Explores/ExploreSourceTabs.js';
import { HeaderSearchBar } from '@/components/Search/SearchBar.js';
import { useParams } from '@dimensiondev/ssr';
import { ExploreType } from '@dimensiondev/enums';

/** The explore sub-navigation (the old @subnav parallel route). */
export function subnav() {
    const { explore } = useParams();
    return (
        <>
            <HeaderSearchBar />
            <ExploreSourceTabs explore={explore as ExploreType} />
        </>
    );
}

export default function ExploreLayout({ children }: { children?: ReactNode }) {
    return <>{children}</>;
}
