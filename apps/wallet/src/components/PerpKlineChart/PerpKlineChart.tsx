import { memo, useState } from 'react';

import { PerpKlineIntervalPills } from '@/components/PerpKlineChart/PerpKlineIntervalPills.js';
import { PerpKlineRenderer } from '@/components/PerpKlineChart/PerpKlineRenderer.js';
import type { KlineInterval } from '@/components/PerpKlineChart/types.js';
import { toPerpsCoinDisplayName } from '@/components/Perps/perpsCoin.js';
import { useCandleHistory } from '@/hooks/perps/useCandleHistory.js';
import { useUserFillMarkers } from '@/hooks/perps/useUserFillMarkers.js';

export interface PerpKlineChartProps {
    coin: string;
    initialInterval: KlineInterval;
    walletAddress: string | null;
}

export const PerpKlineChart = memo<PerpKlineChartProps>(function PerpKlineChart({
    coin,
    initialInterval,
    walletAddress,
}) {
    const [interval, setInterval] = useState<KlineInterval>(initialInterval);
    const coinDisplayName = toPerpsCoinDisplayName(coin);
    const { data: candles, isLoading, error, retry } = useCandleHistory(coin, interval);
    const markers = useUserFillMarkers(coin, walletAddress);

    const showSkeleton = isLoading && candles.length === 0;
    const showError = !!error && candles.length === 0;
    const showChart = !showSkeleton && !showError;

    return (
        <div className="flex size-full flex-col gap-1.5 bg-bg p-2">
            <div className="flex flex-col gap-1">
                <PerpKlineIntervalPills value={interval} onChange={setInterval} />

                <span className="text-sm font-semibold leading-[18px] text-main">
                    {coinDisplayName}USD · {interval} · Hyperliquid
                </span>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden rounded-[10px]">
                {showSkeleton ? <div className="size-full animate-pulse bg-lightBg" /> : null}

                {showError ? (
                    <div className="flex size-full flex-col items-center justify-center gap-3 bg-lightBg">
                        <span className="text-[13px] font-medium leading-[17px] text-second">Chart unavailable</span>
                        <button
                            type="button"
                            className="inline-flex h-8 items-center justify-center rounded-full bg-lightBg px-4 active:opacity-75"
                            onClick={retry}
                        >
                            <span className="text-[13px] font-medium leading-[17px] text-main">Retry</span>
                        </button>
                    </div>
                ) : null}

                {showChart ? <PerpKlineRenderer candles={candles} markers={markers} /> : null}
            </div>
        </div>
    );
});
