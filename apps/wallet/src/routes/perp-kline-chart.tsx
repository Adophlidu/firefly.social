import { createFileRoute } from '@tanstack/react-router';

import { PerpKlineChart } from '@/components/PerpKlineChart/PerpKlineChart.js';
import type { KlineInterval } from '@/components/PerpKlineChart/types.js';

const VALID_INTERVALS: readonly KlineInterval[] = ['1m', '15m', '1h', '4h', 'D'];

interface PerpKlineChartSearch {
    coin: string;
    interval: KlineInterval;
    address?: string;
}

export const Route = createFileRoute('/perp-kline-chart')({
    validateSearch: (search: Record<string, unknown>): PerpKlineChartSearch => {
        const coin = typeof search.coin === 'string' && search.coin.length > 0 ? search.coin : 'BTC';
        const intervalCandidate = typeof search.interval === 'string' ? search.interval : '1h';
        const interval: KlineInterval = (VALID_INTERVALS as readonly string[]).includes(intervalCandidate)
            ? (intervalCandidate as KlineInterval)
            : '1h';
        const address =
            typeof search.address === 'string' && search.address.startsWith('0x') ? search.address : undefined;

        return { coin, interval, address };
    },
    component: PerpKlineChartPage,
});

function PerpKlineChartPage() {
    const { coin, interval, address } = Route.useSearch();

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <PerpKlineChart coin={coin} initialInterval={interval} walletAddress={address ?? null} />
        </div>
    );
}
