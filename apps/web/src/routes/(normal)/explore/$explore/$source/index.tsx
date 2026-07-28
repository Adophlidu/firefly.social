import { EXPLORE_SOURCES } from '@dimensiondev/constants/computed';
import { type ExploreSource, type ExploreSourceInURL, ExploreType, type TrendingType } from '@dimensiondev/enums';
import { notFound, useParams } from '@dimensiondev/ssr';

import { ExplorePage } from '@/legacy/[locale]/(normal)/explore/pages/Explore.js';
import { resolveSourceFromUrl } from '@/helpers/resolveSource.js';

export default function ExploreSourcePage() {
    const { source, explore } = useParams();

    if (explore === ExploreType.Prediction) {
        return <ExplorePage source={source!} type={explore as ExploreType} />;
    }

    const validSources = EXPLORE_SOURCES[explore as ExploreType];
    const exploreSource =
        explore === ExploreType.CryptoTrends
            ? (source as TrendingType)
            : (resolveSourceFromUrl(source as ExploreSourceInURL) as ExploreSource);
    if (validSources?.length && !validSources.includes(exploreSource)) {
        notFound();
    }

    return <ExplorePage source={exploreSource} type={explore as ExploreType} />;
}
