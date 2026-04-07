import { useId } from 'react';
import { useWindowSize } from 'react-use';
import { Virtuoso, type VirtuosoHandle, type VirtuosoProps } from 'react-virtuoso';

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
    const listId = useId();

    return (
        <Virtuoso
            overscan={height}
            increaseViewportBy={height}
            id={listId}
            {...rest}
            data-use-window-scroll={!!rest.useWindowScroll}
            context={{ ...rest.context } as Context}
            isScrolling={(isScrolling) => {
                rest.isScrolling?.(isScrolling);
            }}
            ref={virtuosoRef}
        />
    );
}
