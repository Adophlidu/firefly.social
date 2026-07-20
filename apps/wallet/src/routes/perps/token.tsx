import { PerpsMarketDetail } from '@dimensiondev/rn-ui';
import { useSearch } from '@dimensiondev/ssr';

import { parseSearchParams } from '@/helpers/searchParams.js';

export default PerpsTokenPage;
interface PerpsTokenSearch {
    token?: string;
}

function PerpsTokenPage() {
    const search = parseSearchParams(useSearch()) as PerpsTokenSearch;

    return (
        <div>
            <PerpsMarketDetail coin={search.token || 'BTC'} />
        </div>
    );
}
