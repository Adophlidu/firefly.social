'use client';

import ArrowLineDownIcon from '@dimensiondev/assets/arrow-line-down.svg';
import { EMPTY_LIST } from '@dimensiondev/constants';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { first } from 'lodash-es';
import { type HTMLProps, memo, useLayoutEffect, useMemo, useRef } from 'react';

import { FIFA_SLUG } from '@/constants/bets.js';
import { STALE_TIMES } from '@/constants/query.js';
import { Link } from '@/esm/Link.js';
import { useParams } from '@/esm/navigation.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { getEventSlugListForWeb } from '@/providers/firefly/prediction/getEventSlugList.js';
import { captureExplorePredictionsCategoryClick } from '@/providers/telemetry/capturePolymarketEvent.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

interface Props extends HTMLProps<HTMLDivElement> {
    className?: string;
}

// https://mask.atlassian.net/browse/MX-18286
const FIXED_SLUGS: PolymarketEventSlugListData[] = [
    {
        slug: 'trending',
        label: 'Trending',
        icon_day: '',
        icon_night: '',
        sub_slug: [],
    },
    {
        slug: 'new',
        label: 'New',
        icon_day: '',
        icon_night: '',
        sub_slug: [],
    },
];

interface SlugLabelProps {
    slug: string;
    label: string;
}

function SlugLabel({ slug, label }: SlugLabelProps) {
    switch (slug) {
        case 'trending':
            return <Trans>Trending</Trans>;
        case 'new':
            return <Trans>New</Trans>;
        case FIFA_SLUG:
            return <Trans>World Cup</Trans>;
        default:
            return label;
    }
}

export const PredictionSourceNav = memo<Props>(function PredictionSourceNav({ className }) {
    const { source } = useParams<{ source: string }>();

    const { data } = useQuery({
        queryKey: ['bets', 'slugs-list-web'],
        queryFn: () => getEventSlugListForWeb(),
        staleTime: STALE_TIMES.MINUTE_10,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });

    const activeTabRef = useRef<HTMLAnchorElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const tags = useMemo<Array<PolymarketEventSlugListData & { url?: string }>>(() => {
        const filteredData = [
            ...FIXED_SLUGS,
            ...(data || EMPTY_LIST).map((x) => ({
                ...x,
                url: RouteResolver.predictionCategory({
                    slugs: x.slug,
                }),
            })),
        ];
        if (source && !filteredData.some((x) => x.slug === source)) {
            return [
                { slug: source, label: `${source.slice(0, 1).toUpperCase()}${source.slice(1)}`, sub_slug: EMPTY_LIST },
                ...filteredData,
            ];
        }
        return filteredData;
    }, [data, source]);

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
        <div className="mb-2 mt-3 flex w-full items-center gap-3 px-4">
            <div
                ref={containerRef}
                className={classNames(
                    'no-scrollbar flex min-w-0 flex-1 items-center justify-between overflow-x-auto',
                    className,
                )}
            >
                <nav className="flex space-x-2" aria-label="Tabs">
                    {tags.map((slug) => {
                        const isActive = source === slug.slug;
                        const href = slug.url || RouteResolver.explorePrediction({ slug: slug.slug });

                        return (
                            <Link
                                ref={isActive ? activeTabRef : undefined}
                                href={href}
                                key={slug.slug}
                                className={classNames(
                                    'flex h-[30px] shrink-0 cursor-pointer list-none items-center justify-center whitespace-nowrap rounded-md px-1.5 text-xs lg:flex-initial lg:justify-start',
                                    isActive
                                        ? 'bg-highlight text-white'
                                        : 'bg-thirdMain text-second hover:text-highlight',
                                )}
                                onClick={() => {
                                    captureExplorePredictionsCategoryClick(slug.slug, slug.label);
                                }}
                            >
                                <SlugLabel slug={slug.slug} label={slug.label} />
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <Link
                className="flex h-[30px] items-center gap-1 rounded-full bg-highlight px-3 text-white"
                href={RouteResolver.predictionCategory({
                    slugs: first(tags)?.slug || '',
                })}
                onClick={() => {
                    captureExplorePredictionsCategoryClick(first(tags)?.slug || '', first(tags)?.label || '');
                }}
            >
                <span className="text-sm">
                    <Trans>View More</Trans>
                </span>
                <ArrowLineDownIcon width={14} height={14} className="-rotate-90" />
            </Link>
        </div>
    );
});
