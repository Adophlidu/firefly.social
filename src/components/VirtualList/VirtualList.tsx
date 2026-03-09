'use client';

import { useId, useMemo } from 'react';
import { useWindowSize } from 'react-use';
import { Virtuoso, type VirtuosoHandle, type VirtuosoProps } from 'react-virtuoso';

import { useIsMedium } from '@/hooks/useMediaQuery.js';

export interface VirtualListProps<ItemData = unknown, Context = unknown> extends VirtuosoProps<ItemData, Context> {
    listKey?: string;
    virtuosoRef?: React.RefObject<VirtuosoHandle | null>;
}

export function VirtualList<ItemData = unknown, Context = unknown>({
    listKey: _listKey,
    virtuosoRef,
    ...rest
}: VirtualListProps<ItemData, Context>) {
    const { height } = useWindowSize();
    const isMedium = useIsMedium();
    const listId = useId();

    const context = useMemo(() => ({ ...rest.context, virtualListId: listId }) as Context, [listId, rest.context]);

    return (
        <Virtuoso
            // Disable overscan on mobile to avoid react-virtuoso's urx signal loop
            // that causes "Maximum call stack size exceeded" on iOS.
            // See: https://github.com/petyosi/react-virtuoso/issues/946
            overscan={isMedium ? height : 0}
            increaseViewportBy={height}
            id={listId}
            {...rest}
            data-use-window-scroll={!!rest.useWindowScroll}
            context={context}
            isScrolling={(isScrolling) => {
                rest.isScrolling?.(isScrolling);
            }}
            ref={virtuosoRef}
        />
    );
}
