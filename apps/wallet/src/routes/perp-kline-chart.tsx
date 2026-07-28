import { useSearch } from '@dimensiondev/ssr';

import { PerpKlineChart } from '@/components/PerpKlineChart/PerpKlineChart.js';
import type { KlineInterval } from '@/components/PerpKlineChart/types.js';
import { parseSearchParams } from '@/helpers/searchParams.js';

const VALID_INTERVALS: readonly KlineInterval[] = ['1m', '15m', '1h', '4h', 'D'];

interface PerpKlineChartSearch {
    coin: string;
    interval: KlineInterval;
    address?: string;
}

// Was the route's validateSearch; @dimensiondev/ssr does not validate search
// params at the route level, so the page parses them itself.
function parseChartSearch(search: Record<string, unknown>): PerpKlineChartSearch {
    const coin = typeof search.coin === 'string' && search.coin.length > 0 ? search.coin : 'BTC';
    const intervalCandidate = typeof search.interval === 'string' ? search.interval : '1h';
    const interval: KlineInterval = (VALID_INTERVALS as readonly string[]).includes(intervalCandidate)
        ? (intervalCandidate as KlineInterval)
        : '1h';
    const address = typeof search.address === 'string' && search.address.startsWith('0x') ? search.address : undefined;

    return { coin, interval, address };
}

export default function PerpKlineChartPage() {
    const { coin, interval, address } = parseChartSearch(parseSearchParams(useSearch()));

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <PerpKlineChart coin={coin} initialInterval={interval} walletAddress={address ?? null} />
        </div>
    );
}
