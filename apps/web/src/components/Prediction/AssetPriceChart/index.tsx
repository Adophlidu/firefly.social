'use client';

import type { PredictionPlatform } from '@dimensiondev/enums';
import { useState } from 'react';

import { Loading } from '@/components/Loading.js';
import { AssetPrices } from '@/components/Prediction/AssetPriceChart/AssetPrices.js';
import { CRYPTO_PRICE_CHART_HEIGHT, type PredictionCrypto } from '@/constants/bets.js';
import { dynamic } from '@/esm/dynamic.js';
import type { PredictionRecurrence } from '@/types/prediction.js';

const LivePriceChart = dynamic(
    () => import('@/components/Prediction/AssetPriceChart/LivePriceChart.js').then((m) => m.LivePriceChart),
    {
        ssr: false,
        loading: () => <Loading minHeight={CRYPTO_PRICE_CHART_HEIGHT} />,
    },
);
const HistoryPriceChart = dynamic(
    () => import('@/components/Prediction/AssetPriceChart/HistoryPriceChart.js').then((m) => m.HistoryPriceChart),
    {
        ssr: false,
        loading: () => <Loading minHeight={CRYPTO_PRICE_CHART_HEIGHT} />,
    },
);

interface AssetPriceChartProps {
    isActive: boolean;
    crypto: PredictionCrypto;
    seriesId: string;
    platform: PredictionPlatform;
    startTime?: string;
    endDate?: string;
    recurrence?: PredictionRecurrence;
    priceToBeat?: number;
    finalPrice?: number;
    isMultiStrike?: boolean;
}

export function AssetPriceChart({
    isActive,
    crypto,
    recurrence,
    startTime,
    endDate,
    platform,
    seriesId,
    priceToBeat,
    finalPrice,
    isMultiStrike,
}: AssetPriceChartProps) {
    const [latestPrice, setLatestPrice] = useState<number | null>(null);

    if (!startTime || !endDate || !recurrence) return null;

    return (
        <div>
            <AssetPrices
                isActive={isActive}
                endDate={endDate}
                startTime={startTime}
                recurrence={recurrence}
                latestPrice={latestPrice}
                seriesId={seriesId}
                platform={platform}
                crypto={crypto}
                priceToBeat={priceToBeat}
                finalPrice={finalPrice}
                isMultiStrike={isMultiStrike}
            />

            <div className="px-4">
                {isActive ? (
                    <LivePriceChart
                        crypto={crypto}
                        recurrence={recurrence}
                        priceToBeat={priceToBeat}
                        onPriceUpdate={setLatestPrice}
                    />
                ) : (
                    <HistoryPriceChart
                        crypto={crypto}
                        eventStartTime={startTime}
                        endDate={endDate}
                        recurrence={recurrence}
                        priceToBeat={priceToBeat}
                    />
                )}
            </div>
        </div>
    );
}
