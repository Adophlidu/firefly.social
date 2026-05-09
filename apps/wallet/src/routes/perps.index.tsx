import { createFileRoute, useSearch } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

import { PerpsTradeRouteSkeleton } from '@/components/Perps/PerpsTradeRouteSkeleton.js';

const PerpsTradeDetail = lazy(async () => {
    const m = await import('@dimensiondev/rn-ui');
    return { default: m.PerpsTradeDetail };
});

export const Route = createFileRoute('/perps/')({
    component: PerpsTradePage,
});

interface PerpsTradeSearch {
    token?: string;
}

function PerpsTradePage() {
    const search = useSearch({ from: '/perps/' }) as PerpsTradeSearch;

    return (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <Suspense fallback={<PerpsTradeRouteSkeleton />}>
                <PerpsTradeDetail coin={search.token || 'BTC'} />
            </Suspense>
        </div>
    );
}
