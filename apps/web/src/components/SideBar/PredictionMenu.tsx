'use client';

import PredictionSelectedIcon from '@dimensiondev/assets/prediction.selected.svg';
import PredictionIcon from '@dimensiondev/assets/prediction.svg';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo, useMemo } from 'react';

import { BaseMenuItem } from '@/components/SideBar/BaseMenuItem.js';
import { STALE_TIMES } from '@/constants/query.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { getEventSlugList } from '@/providers/firefly/prediction/getEventSlugList.js';
import { POLYMARKET_FIREFLY_SLUG } from '@/providers/prediction/polymarket/constants.js';

interface PredictionMenuProps {
    isSelected: boolean;
    collapsed: boolean;
    size?: number;
}

export const PredictionMenu = memo<PredictionMenuProps>(function PredictionMenu({ isSelected, collapsed, size = 20 }) {
    const { data } = useQuery({
        queryKey: ['bets', 'slugs-list'],
        queryFn: () => getEventSlugList(),
        staleTime: STALE_TIMES.INFINITY,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });

    const href = useMemo(() => {
        const firstNormalSlug = data?.find((x) => x.slug !== POLYMARKET_FIREFLY_SLUG)?.slug;
        return RouteResolver.predictionCategory({ slug: firstNormalSlug || 'trending', appendRoot: false });
    }, [data]);

    return (
        <BaseMenuItem
            href={href}
            isSelected={isSelected}
            collapsed={collapsed}
            menuName={<Trans>Predictions</Trans>}
            icon={
                <span className="relative flex size-5 items-center justify-center">
                    <PredictionIcon
                        width={size}
                        height={size}
                        className={isSelected ? 'hidden' : 'block group-hover:hidden'}
                    />
                    <PredictionSelectedIcon
                        width={size}
                        height={size}
                        className={isSelected ? 'block' : 'hidden group-hover:block'}
                    />
                </span>
            }
        />
    );
});
