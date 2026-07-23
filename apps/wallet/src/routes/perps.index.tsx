import { decodePerpsIntent } from '@dimensiondev/iframe-bridge';
import { createFileRoute, useSearch } from '@tanstack/react-router';

import { PerpsAccountPage } from '@/components/Perps/PerpsAccountPage.js';
import { PerpsOrderIntentPage } from '@/components/Perps/PerpsOrderIntentPage.js';

export const Route = createFileRoute('/perps/')({
    component: PerpsTradePage,
});

interface PerpsTradeSearch {
    kind?: string;
    coin?: string;
    direction?: 'buy' | 'sell';
    orderType?: 'market' | 'limit';
    token?: string;
}

function PerpsTradePage() {
    const search = useSearch({ from: '/perps/' }) as PerpsTradeSearch;

    if (search.kind === 'place-order' && search.coin && search.direction) {
        return <PerpsOrderIntentPage coin={search.coin} direction={search.direction} orderType={search.orderType} />;
    }
    if (search.kind) {
        const decoded = decodePerpsIntent(new URLSearchParams(search as Record<string, string>));
        if (decoded.ok && !['account', 'deposit', 'withdraw', 'place-order'].includes(decoded.value.kind)) {
            return <PerpsAccountPage intent={decoded.value as never} />;
        }
    }
    return <PerpsAccountPage />;
}
