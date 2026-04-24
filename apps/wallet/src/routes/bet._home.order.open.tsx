import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

import { OpenOrdersSkeleton } from '@/components/Bet/OpenOrdersSkeleton.js';

const OpenOrders = lazy(() => import('@/components/Bet/OpenOrders.js').then((m) => ({ default: m.OpenOrders })));

export const Route = createFileRoute('/bet/_home/order/open')({
    component: OpenOrdersPage,
    pendingComponent: OpenOrdersSkeleton,
});

function OpenOrdersPage() {
    return (
        <Suspense fallback={<OpenOrdersSkeleton />}>
            <OpenOrders />
        </Suspense>
    );
}
