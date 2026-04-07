import { useWindowSize } from 'react-use';
import { VirtuosoGrid, type VirtuosoGridProps } from 'react-virtuoso';

export interface VirtualGridListProps<ItemData = unknown, Context = unknown>
    extends VirtuosoGridProps<ItemData, Context> {
    listKey?: string;
}

export function VirtualGridList<ItemData = unknown, Context = unknown>({
    listKey,
    ...rest
}: VirtualGridListProps<ItemData, Context>) {
    const { height } = useWindowSize();
    return <VirtuosoGrid overscan={height} {...rest} />;
}
