import { PerpsTradeDetail } from '@dimensiondev/rn-ui';
import { createFileRoute, useSearch } from '@tanstack/react-router';

export const Route = createFileRoute('/perps/')({
    component: PerpsTradePage,
});

interface PerpsTradeSearch {
    token?: string;
}

function PerpsTradePage() {
    const search = useSearch({ from: '/perps/' }) as PerpsTradeSearch;

    return (
        <div>
            <PerpsTradeDetail coin={search.token || 'BTC'} />
        </div>
    );
}
