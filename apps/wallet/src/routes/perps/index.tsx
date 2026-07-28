import { decodePerpsIntent } from '@dimensiondev/iframe-bridge';
import { useSearch } from '@dimensiondev/ssr';

import { PerpsAccountPage } from '@/components/Perps/PerpsAccountPage.js';
import { PerpsOrderIntentPage } from '@/components/Perps/PerpsOrderIntentPage.js';
import { parseSearchParams } from '@/helpers/searchParams.js';

export default PerpsTradePage;
interface PerpsTradeSearch {
    kind?: string;
    coin?: string;
    direction?: 'buy' | 'sell';
    orderType?: 'market' | 'limit';
    token?: string;
}

function PerpsTradePage() {
    const search = parseSearchParams(useSearch()) as PerpsTradeSearch;

    if (search.kind === 'place-order' && search.coin && search.direction) {
        return (
            <PerpsOrderIntentPage
                key={search.coin}
                coin={search.coin}
                direction={search.direction}
                orderType={search.orderType}
            />
        );
    }
    if (search.kind) {
        const decoded = decodePerpsIntent(new URLSearchParams(search as Record<string, string>));
        if (decoded.ok && !['account', 'deposit', 'withdraw', 'place-order'].includes(decoded.value.kind)) {
            return <PerpsAccountPage intent={decoded.value as never} />;
        }
    }
    return <PerpsAccountPage />;
}
