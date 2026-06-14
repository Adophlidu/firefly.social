'use client';

import FootballIcon from '@dimensiondev/assets/football.svg';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo, useMemo, useState } from 'react';

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

    // The animated GIF can take a moment to fetch. Show a complete soccer-ball
    // SVG as a placeholder and swap to the GIF once it has loaded.
    const [gifLoaded, setGifLoaded] = useState(false);

    return (
        <BaseMenuItem
            href={href}
            isSelected={isSelected}
            collapsed={collapsed}
            menuName={<Trans>Predictions</Trans>}
            icon={
                <span className="relative flex size-5 items-center justify-center">
                    {/* Animated GIF: next/image would need `unoptimized`, so a plain <img> is the right tool here. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/football.gif"
                        alt=""
                        width={size}
                        height={size}
                        ref={(node) => {
                            // A cached GIF can finish loading before React attaches `onLoad`,
                            // leaving the handler unfired. Catch the already-complete case here.
                            if (node?.complete && node.naturalWidth > 0) setGifLoaded(true);
                        }}
                        onLoad={() => setGifLoaded(true)}
                        className={classNames('size-full object-contain', { invisible: !gifLoaded })}
                    />
                    {!gifLoaded ? (
                        <FootballIcon width={size} height={size} className="absolute inset-0 size-full" />
                    ) : null}
                </span>
            }
        />
    );
});
