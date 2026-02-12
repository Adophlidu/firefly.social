import { useQuery } from '@tanstack/react-query';
import { first } from 'lodash-es';
import { useMemo } from 'react';

import { EXPLORE_TYPES } from '@/constants/computed.js';
import { ExploreType } from '@/constants/enum.js';
import { NFT_ENABLED } from '@/constants/static.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { getEventSlugList } from '@/providers/firefly/prediction/getEventSlugList.js';
import { POLYMARKET_FIREFLY_SLUG } from '@/providers/prediction/polymarket/constants.js';

export function useExploreTabs() {
    const { data } = useQuery({
        queryKey: ['bets', 'slugs-list'],
        queryFn: () => getEventSlugList(),
        staleTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });

    return useMemo(() => {
        let baseTypes = EXPLORE_TYPES.filter((x) => (NFT_ENABLED ? true : x !== ExploreType.NFTs)).map((type) => ({
            type,
            id: `${type}`,
            link: '',
            label: '',
        }));

        const firstNormalSlugData = data?.find((x) => x.slug !== POLYMARKET_FIREFLY_SLUG);
        if (firstNormalSlugData) {
            baseTypes = baseTypes.map((x) => {
                if (x.type === ExploreType.Prediction && x.id === ExploreType.Prediction) {
                    return { ...x, link: RouteResolver.explorePrediction(firstNormalSlugData.slug) };
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
                link: RouteResolver.explorePrediction(POLYMARKET_FIREFLY_SLUG, firstSubSlug),
            });
        }

        return baseTypes;
    }, [data]);
}
