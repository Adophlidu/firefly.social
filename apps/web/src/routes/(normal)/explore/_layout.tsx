/* eslint-disable react-hooks/rules-of-hooks -- slot exports are components, but named after the slot (lowercase) they fill */
import type { ExploreType } from '@dimensiondev/enums';
import { useParams } from '@dimensiondev/ssr';
import type { ReactNode } from 'react';

import { ExploreSourceTabs } from '@/components/Explores/ExploreSourceTabs.js';
import { HeaderSearchBar } from '@/components/Search/SearchBar.js';

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
