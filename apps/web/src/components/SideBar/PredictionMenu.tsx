'use client';

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
                <span className="flex size-5 items-center justify-center">
                    {/* Static SVG (baked from football.json's final frame). A plain <img> keeps
                        the 14.5KB markup out of the JS bundle; `next/image` is unsuitable for SVG. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/football.svg"
                        alt=""
                        width={size}
                        height={size}
                        className="football-bounce size-full object-contain"
                    />
                </span>
            }
        />
    );
});
