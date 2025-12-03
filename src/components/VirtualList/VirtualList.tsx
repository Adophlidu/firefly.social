'use client';

import { useEffect, useId, useMemo } from 'react';
import { useWindowSize } from 'react-use';
import { Virtuoso, type VirtuosoHandle, type VirtuosoProps } from 'react-virtuoso';

import { useThrottledCallback } from '@/hooks/useThrottledCallback.js';
import { useVirtualListScrollable } from '@/hooks/useVirtualListScrollable.js';

export interface VirtualListProps<ItemData = unknown, Context = unknown> extends VirtuosoProps<ItemData, Context> {
    listKey?: string;
    virtuosoRef?: React.RefObject<VirtuosoHandle | null>;
}

export function VirtualList<ItemData = unknown, Context = unknown>({
    listKey,
    virtuosoRef,
    ...rest
}: VirtualListProps<ItemData, Context>) {
    const { height } = useWindowSize();
    const listId = useId();
    const [isScrollable, onDetectScrollable] = useVirtualListScrollable(listId);

    // Throttle scroll detection using requestAnimationFrame for optimal performance
    const throttledDetectScrollable = useThrottledCallback(onDetectScrollable);

    useEffect(() => {
        if (!rest.useWindowScroll) return;

        window.addEventListener('scroll', throttledDetectScrollable, { passive: true });
        return () => {
            window.removeEventListener('scroll', throttledDetectScrollable);
            // Cancel any pending animation frame on cleanup
            throttledDetectScrollable.cancel();
        };
    }, [rest.useWindowScroll, throttledDetectScrollable]);

    const context = useMemo(() => ({ ...rest.context, isScrollable }) as Context, [rest.context, isScrollable]);

    return (
        <Virtuoso
            overscan={height}
            increaseViewportBy={height}
            id={listId}
            {...rest}
            data-use-window-scroll={!!rest.useWindowScroll}
            context={context}
            isScrolling={(isScrolling) => {
                throttledDetectScrollable();
                rest.isScrolling?.(isScrolling);
            }}
            ref={virtuosoRef}
        />
    );
}
