import { useSearch } from '@dimensiondev/ssr';
import { lazy, Suspense } from 'react';

import { PerpsTradeRouteSkeleton } from '@/components/Perps/PerpsTradeRouteSkeleton.js';
import { parseSearchParams } from '@/helpers/searchParams.js';

const PerpsTradeDetail = lazy(async () => {
    const m = await import('@dimensiondev/rn-ui');
    return { default: m.PerpsTradeDetail };
});

export default PerpsTradePage;
interface PerpsTradeSearch {
    token?: string;
}

function PerpsTradePage() {
    const search = parseSearchParams(useSearch()) as PerpsTradeSearch;

    return (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <Suspense fallback={<PerpsTradeRouteSkeleton />}>
                <PerpsTradeDetail coin={search.token || 'BTC'} />
            </Suspense>
        </div>
    );
}
