import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense, useEffect } from 'react';

import { OpenOrdersSkeleton } from '@/components/Bet/OpenOrdersSkeleton.js';
import { captureWalletTelemetryEvent, WalletTelemetryEventId } from '@/helpers/swap/swapAnalytics.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';

const OpenOrders = lazy(() => import('@/components/Bet/OpenOrders.js').then((m) => ({ default: m.OpenOrders })));

export const Route = createFileRoute('/bet/_home/order/open')({
    component: OpenOrdersPage,
    pendingComponent: OpenOrdersSkeleton,
});

function OpenOrdersPage() {
    const { data: account } = useSuspenseQuery(getPolymarketAccountQueryOptions());

    useEffect(() => {
        if (account?.proxyAddress) {
            captureWalletTelemetryEvent(WalletTelemetryEventId.BETS_ORDERS_LIST_OPEN_SUCCESS, {
                proxy_wallet_address: account.proxyAddress,
            });
        }
    }, [account?.proxyAddress]);

    return (
        <Suspense fallback={<OpenOrdersSkeleton />}>
            <OpenOrders />
        </Suspense>
    );
}
