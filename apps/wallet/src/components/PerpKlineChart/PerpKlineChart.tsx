import { memo, useState } from 'react';

import { PerpKlineIntervalPills } from '@/components/PerpKlineChart/PerpKlineIntervalPills.js';
import { PerpKlineRenderer } from '@/components/PerpKlineChart/PerpKlineRenderer.js';
import type { KlineInterval } from '@/components/PerpKlineChart/types.js';
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
    const { data: candles, isLoading, error, retry } = useCandleHistory(coin, interval);
    const markers = useUserFillMarkers(coin, walletAddress);

    const showSkeleton = isLoading && candles.length === 0;
    const showError = !!error && candles.length === 0;
    const showChart = !showSkeleton && !showError;

    return (
        <div className="bg-bg flex size-full flex-col gap-1.5 p-2">
            <div className="flex flex-col gap-1">
                <PerpKlineIntervalPills value={interval} onChange={setInterval} />

                <span className="text-main text-sm font-semibold leading-[18px]">
                    {coin}USD · {interval} · Hyperliquid
                </span>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden rounded-[10px]">
                {showSkeleton ? <div className="bg-lightBg size-full animate-pulse" /> : null}

                {showError ? (
                    <div className="bg-lightBg flex size-full flex-col items-center justify-center gap-3">
                        <span className="text-second text-[13px] font-medium leading-[17px]">Chart unavailable</span>
                        <button
                            type="button"
                            className="bg-lightBg inline-flex h-8 items-center justify-center rounded-full px-4 active:opacity-75"
                            onClick={retry}
                        >
                            <span className="text-main text-[13px] font-medium leading-[17px]">Retry</span>
                        </button>
                    </div>
                ) : null}

                {showChart ? <PerpKlineRenderer candles={candles} markers={markers} /> : null}
            </div>
        </div>
    );
});
