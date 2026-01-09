'use client';

import { classNames } from '@dimensiondev/utils';
import { useQuery } from '@tanstack/react-query';
import { type HTMLProps, memo } from 'react';

import { Link } from '@/components/Link.js';
import { getEventSlugList } from '@/providers/firefly/bets/getEventSlugList.js';

interface Props extends HTMLProps<HTMLDivElement> {
    className?: string;
    source: string;
}

export const BetsSourceNav = memo<Props>(function BetsSourceNav({ className, source }) {
    const { data } = useQuery({
        queryKey: ['bets', 'slugs-list'],
        queryFn: () => getEventSlugList(),
        staleTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });

    if (!data) return null;

    return (
        <div className={classNames('no-scrollbar flex items-center justify-between overflow-x-auto', className)}>
            <nav className="flex space-x-2 px-1.5 pb-1.5 pt-3" aria-label="Tabs">
                {data.map((slug) => (
                    <Link
                        href={`/explore/bets/${slug.slug}`}
                        key={slug.slug}
                        className={classNames(
                            'flex h-6 shrink-0 cursor-pointer list-none justify-center whitespace-nowrap rounded-md px-1.5 text-xs leading-6 lg:flex-initial lg:justify-start',
                            source === slug.slug
                                ? 'bg-highlight text-white'
                                : 'bg-thirdMain text-second hover:text-highlight',
                        )}
                    >
                        {slug.label}
                    </Link>
                ))}
            </nav>
        </div>
    );
});
