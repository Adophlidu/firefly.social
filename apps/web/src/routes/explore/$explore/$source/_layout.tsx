import { ExploreType } from '@dimensiondev/enums';
import { type LoaderContext, useLoaderData } from '@dimensiondev/ssr';
import type { ReactNode } from 'react';

import { getExploreChannelsPageData } from '@/app/[locale]/(normal)/explore/[explore]/[source]/getExploreChannelsPageData.js';
import { ExploreChannelsProvider } from '@/components/Explores/ExploreChannelsContext.js';
import type { ExploreChannelsInitialData } from '@/helpers/buildExploreChannelsInitialData.js';

interface ExploreLayoutData {
    /** Computed on the server; the client must render the same branch. */
    isTopChannels: boolean;
    initialChannelsPage?: ExploreChannelsInitialData;
}

export async function loader({ params }: LoaderContext): Promise<ExploreLayoutData> {
    const isTopChannels = params.explore === ExploreType.TopChannels;
    return {
        isTopChannels,
        initialChannelsPage: isTopChannels ? await getExploreChannelsPageData(params.source!) : undefined,
    };
}

/**
 * Port of the Next explore source layout
 * (src/app/[locale]/(normal)/explore/[explore]/[source]/layout.tsx):
 * only TopChannels pages are wrapped in an ExploreChannelsProvider seeded
 * with the first channels page; other explore types render untouched.
 */
export default function ExploreSourceLayout({ children }: { children?: ReactNode }) {
    const { isTopChannels, initialChannelsPage } = useLoaderData<ExploreLayoutData>(
        'explore/$explore/$source/_layout.tsx',
    );

    if (!isTopChannels) return <>{children}</>;

    return <ExploreChannelsProvider initialChannelsPage={initialChannelsPage}>{children}</ExploreChannelsProvider>;
}
