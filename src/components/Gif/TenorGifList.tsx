import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { forwardRef } from 'react';
import type { GridItemProps, GridListProps } from 'react-virtuoso';

import { GridListInPage } from '@/components/GridListInPage.js';
import { Image } from '@/components/Image.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { createIndicator, createNextIndicator, createPageable } from '@/helpers/pageable.js';
import { fetchTenorGifs } from '@/services/fetchTenorGifs.js';
import type { IGif } from '@/types/giphy.js';

function getItemContent(gif: IGif, onSelected: (gif: IGif) => void) {
    return (
        <div className="h-40 cursor-pointer" onClick={() => onSelected(gif)}>
            <Image
                width={160}
                height={160}
                className="h-full w-full object-cover"
                src={gif.images.preview_gif.url}
                alt={gif.title}
            />
        </div>
    );
}

const GridList = forwardRef<HTMLDivElement, GridListProps>(function GridList({ className, children, ...props }, ref) {
    return (
        <div
            ref={ref}
            {...props}
            className={classNames('grid grid-cols-3 gap-3.5 md:grid-cols-4 lg:grid-cols-3', className)}
        >
            {children}
        </div>
    );
});

const GridItem = forwardRef<HTMLDivElement, GridItemProps>(function GridItem({ children, ...props }, ref) {
    return (
        <div {...props} ref={ref}>
            {children}
        </div>
    );
});

interface TenorGifListProps {
    keyword: string;
    onSelected: (gif: IGif) => void;
}

export function TenorGifList({ keyword, onSelected }: TenorGifListProps) {
    const queryResult = useSuspenseInfiniteQuery({
        initialPageParam: '',
        queryKey: ['tenor-gif-list', keyword],
        queryFn: async ({ pageParam }) => {
            const result = await fetchTenorGifs({ cursor: pageParam, q: keyword || undefined });

            return createPageable(
                result.data,
                createIndicator(),
                result.cursor ? createNextIndicator(undefined, result.cursor) : undefined,
            );
        },
        getNextPageParam: (lastPage) => lastPage?.nextIndicator?.id,
        select: (data) => data.pages.flatMap((page) => page.data ?? EMPTY_LIST),
    });

    return (
        <GridListInPage
            hiddenFooter
            queryResult={queryResult}
            className="no-scrollbar mt-2 h-full"
            VirtualGridListProps={{
                useWindowScroll: false,
                className: 'no-scrollbar',
                components: { List: GridList, Item: GridItem },
                itemContent: (_, item) => {
                    return getItemContent(item, onSelected);
                },
            }}
        />
    );
}
