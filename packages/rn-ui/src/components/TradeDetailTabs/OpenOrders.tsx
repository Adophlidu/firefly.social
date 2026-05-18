import { Trans } from '@lingui/react/macro';
import { memo, useMemo } from 'react';
import { YStack } from 'tamagui';

import { NoDataFallback } from '@/components/NoDataFallback';
import { OpenOrderCard } from '@/components/TradeDetailTabs/OpenOrderCard';
import type { OpenOrder } from '@/types/ui';

interface OpenOrdersProps {
    openOrders: OpenOrder[];
}

function sortOrders(orders: OpenOrder[]) {
    const sortedOrders: OpenOrder[] = [];

    orders.forEach((order) => {
        if (order.children.length) {
            sortedOrders.push(order);

            order.children.forEach((child) => {
                const childInList = orders.find((o) => o.oid === child.oid);
                if (childInList) {
                    sortedOrders.push(childInList);
                }
            });
        } else {
            const hasMainOrder = orders.some((o) => o.children.some((child) => child.oid === order.oid));
            if (!hasMainOrder) {
                sortedOrders.push(order);
            }
        }
    });

    return sortedOrders;
}

export const OpenOrders = memo<OpenOrdersProps>(function OpenOrders({ openOrders }) {
    const sortedOrders = useMemo(() => sortOrders(openOrders), [openOrders]);

    if (!sortedOrders.length) {
        return <NoDataFallback message={<Trans id="rn-ui.openOrders.empty">No open orders</Trans>} />;
    }

    return (
        <YStack gap={16} paddingBottom={40}>
            {sortedOrders.map((order) => (
                <OpenOrderCard order={order} key={order.oid} />
            ))}
        </YStack>
    );
});
