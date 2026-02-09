'use client';

import { classNames } from '@dimensiondev/utils';
import { useQuery } from '@tanstack/react-query';
import { type HTMLProps, memo, useLayoutEffect, useMemo, useRef } from 'react';

import { Link } from '@/components/Link.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { useParams } from '@/esm/navigation.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { getEventSlugList } from '@/providers/firefly/prediction/getEventSlugList.js';
import { captureExplorePredictionsCategoryClick } from '@/providers/telemetry/capturePolymarketEvent.js';

interface Props extends HTMLProps<HTMLDivElement> {
    className?: string;
}

export const PredictionSourceNav = memo<Props>(function PredictionSourceNav({ className }) {
    const { source } = useParams<{ source: string }>();
    const { data } = useQuery({
        queryKey: ['bets', 'slugs-list'],
        queryFn: () => getEventSlugList(),
        staleTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });

    const activeTabRef = useRef<HTMLAnchorElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const tags = useMemo(() => {
        if (!data) return EMPTY_LIST;

        if (source && !data.some((x) => x.slug === source)) {
            return [
                { slug: source, label: `${source.slice(0, 1).toUpperCase()}${source.slice(1)}`, sub_slug: EMPTY_LIST },
                ...data,
            ];
        }
        return data;
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

    if (!data) return null;

    return (
        <div
            ref={containerRef}
            className={classNames('no-scrollbar flex items-center justify-between overflow-x-auto', className)}
        >
            <nav className="flex space-x-2 px-1.5 pb-1.5 pt-3" aria-label="Tabs">
                {tags.map((slug) => (
                    <Link
                        ref={source === slug.slug ? activeTabRef : undefined}
                        href={RouteResolver.explorePrediction(slug.slug)}
                        key={slug.slug}
                        className={classNames(
                            'flex h-6 shrink-0 cursor-pointer list-none justify-center whitespace-nowrap rounded-md px-1.5 text-xs leading-6 lg:flex-initial lg:justify-start',
                            source === slug.slug
                                ? 'bg-highlight text-white'
                                : 'bg-thirdMain text-second hover:text-highlight',
                        )}
                        onClick={() => {
                            captureExplorePredictionsCategoryClick(slug.label);
                        }}
                    >
                        {slug.label}
                    </Link>
                ))}
            </nav>
        </div>
    );
});
