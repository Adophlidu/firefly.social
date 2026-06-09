import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense, useEffect } from 'react';

import { OpenOrdersSkeleton } from '@/components/Bet/OpenOrdersSkeleton.js';
import { captureWalletTelemetryEvent, WalletTelemetryEventId } from '@/helpers/swap/swapAnalytics.js';

const OpenOrders = lazy(() => import('@/components/Bet/OpenOrders.js').then((m) => ({ default: m.OpenOrders })));

export const Route = createFileRoute('/bet/_home/order/open')({
    component: OpenOrdersPage,
    pendingComponent: OpenOrdersSkeleton,
});

function OpenOrdersPage() {
    useEffect(() => {
        captureWalletTelemetryEvent(WalletTelemetryEventId.BETS_ORDERS_LIST_OPEN_SUCCESS, {});
    }, []);

    return (
        <Suspense fallback={<OpenOrdersSkeleton />}>
            <OpenOrders />
        </Suspense>
    );
}
