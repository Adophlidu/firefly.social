'use client';

import { EMPTY_LIST } from '@dimensiondev/constants';
import { classNames } from '@dimensiondev/utils';
import { useQuery } from '@tanstack/react-query';
import { useQueryState } from 'nuqs';
import { type HTMLProps, memo, useLayoutEffect, useMemo, useRef } from 'react';

import { Link } from '@/components/Link.js';
import { STALE_TIMES } from '@/constants/query.js';
import { useParams } from '@/esm/navigation.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { getEventSlugList } from '@/providers/firefly/prediction/getEventSlugList.js';
import { POLYMARKET_FIREFLY_SLUG } from '@/providers/prediction/polymarket/constants.js';
import { captureExplorePredictionsCategoryClick } from '@/providers/telemetry/capturePolymarketEvent.js';

interface Props extends HTMLProps<HTMLDivElement> {
    className?: string;
}

export const PredictionSourceNav = memo<Props>(function PredictionSourceNav({ className }) {
    const { source } = useParams<{ source: string }>();
    const [subSlug] = useQueryState('subSlug', { defaultValue: '' });

    const { data } = useQuery({
        queryKey: ['bets', 'slugs-list'],
        queryFn: () => getEventSlugList(),
        staleTime: STALE_TIMES.INFINITY,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });

    const activeTabRef = useRef<HTMLAnchorElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const isFireflySlugPage =
        !!data?.some((x) => x.slug === POLYMARKET_FIREFLY_SLUG) && source === POLYMARKET_FIREFLY_SLUG;
    const tags = useMemo(() => {
        if (!data) return EMPTY_LIST;

        if (isFireflySlugPage) {
            const fireflySlugData = data.find((x) => x.slug === POLYMARKET_FIREFLY_SLUG);
            return fireflySlugData?.sub_slug || EMPTY_LIST;
        }

        const filteredData = data.filter((x) => x.slug !== POLYMARKET_FIREFLY_SLUG);
        if (source && !filteredData.some((x) => x.slug === source)) {
            return [
                { slug: source, label: `${source.slice(0, 1).toUpperCase()}${source.slice(1)}`, sub_slug: EMPTY_LIST },
                ...filteredData,
            ];
        }
        return filteredData;
    }, [data, source, isFireflySlugPage]);

    useLayoutEffect(() => {
        if (!activeTabRef.current) {
            return;
        }

        activeTabRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center',
        });
    }, []);

    if (!data || !tags?.length) return null;

    return (
        <div
            ref={containerRef}
            className={classNames('no-scrollbar flex items-center justify-between overflow-x-auto', className)}
        >
            <nav className="flex space-x-2 px-1.5 pb-1.5 pt-3" aria-label="Tabs">
                {tags.map((slug) => {
                    const isActive = isFireflySlugPage ? subSlug === slug.slug : source === slug.slug;
                    const href = isFireflySlugPage
                        ? RouteResolver.explorePrediction(POLYMARKET_FIREFLY_SLUG, slug.slug)
                        : RouteResolver.explorePrediction(slug.slug);

                    return (
                        <Link
                            ref={isActive ? activeTabRef : undefined}
                            href={href}
                            key={slug.slug}
                            className={classNames(
                                'flex h-6 shrink-0 cursor-pointer list-none justify-center whitespace-nowrap rounded-md px-1.5 text-xs leading-6 lg:flex-initial lg:justify-start',
                                isActive ? 'bg-highlight text-white' : 'bg-thirdMain text-second hover:text-highlight',
                            )}
                            onClick={() => {
                                captureExplorePredictionsCategoryClick(slug.label);
                            }}
                        >
                            {slug.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
});
