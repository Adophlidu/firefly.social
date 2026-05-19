import { EXPLORE_TYPES } from '@dimensiondev/constants/computed';
import { ExploreType } from '@dimensiondev/enums';
import { useQuery } from '@tanstack/react-query';
import { first } from 'lodash-es';
import { useMemo } from 'react';

import { STALE_TIMES } from '@/constants/query.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { getEventSlugList } from '@/providers/firefly/prediction/getEventSlugList.js';
import { POLYMARKET_FIREFLY_SLUG } from '@/providers/prediction/polymarket/constants.js';

export function useExploreTabs() {
    const { data } = useQuery({
        queryKey: ['bets', 'slugs-list'],
        queryFn: () => getEventSlugList(),
        staleTime: STALE_TIMES.INFINITY,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });

    return useMemo(() => {
        let baseTypes = EXPLORE_TYPES.map((type) => ({
            type,
            id: `${type}`,
            link: '',
            label: '',
        }));

        const firstNormalSlugData = data?.find((x) => x.slug !== POLYMARKET_FIREFLY_SLUG);
        if (firstNormalSlugData) {
            baseTypes = baseTypes.map((x) => {
                if (x.type === ExploreType.Prediction && x.id === ExploreType.Prediction) {
                    return {
                        ...x,
                        link: RouteResolver.explorePrediction({ slug: firstNormalSlugData.slug, appendRoot: false }),
                    };
                }

                return x;
            });
        }

        const fireflySlugData = data?.find((x) => x.slug === POLYMARKET_FIREFLY_SLUG);
        if (fireflySlugData) {
            const firstSubSlug = first(fireflySlugData.sub_slug)?.slug;
            baseTypes.unshift({
                type: ExploreType.Prediction,
                id: POLYMARKET_FIREFLY_SLUG,
                label: fireflySlugData.label,
                link: RouteResolver.explorePrediction({
                    slug: POLYMARKET_FIREFLY_SLUG,
                    subSlug: firstSubSlug,
                    appendRoot: false,
                }),
            });
        }

        return baseTypes;
    }, [data]);
}
