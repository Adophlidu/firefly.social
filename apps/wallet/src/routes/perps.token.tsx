import { PerpsMarketDetail } from '@dimensiondev/rn-ui';
import { createFileRoute, useSearch } from '@tanstack/react-router';

export const Route = createFileRoute('/perps/token')({
    component: PerpsTokenPage,
});

interface PerpsTokenSearch {
    token?: string;
}

function PerpsTokenPage() {
    const search = useSearch({ from: '/perps/token' }) as PerpsTokenSearch;

    return (
        <div>
            <PerpsMarketDetail coin={search.token || 'BTC'} />
        </div>
    );
}
