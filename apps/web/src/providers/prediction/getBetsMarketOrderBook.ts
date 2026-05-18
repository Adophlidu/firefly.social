import { PredictionPlatform } from '@dimensiondev/enums';
import { NotImplementedError, unreachable } from '@dimensiondev/utils';
import { has } from 'lodash-es';

import { getPolymarketLastPrice } from '@/providers/firefly/prediction/getPolymarketLastPrice.js';
import { getPolymarketOrderBook } from '@/providers/firefly/prediction/getPolymarketOrderBook.js';
import { getPolymarketSpreads } from '@/providers/firefly/prediction/getPolymarketSpreads.js';
import type { BetsMarketDataForUI, BetsOrderBookItem } from '@/types/prediction.js';

interface Options {
    market: BetsMarketDataForUI;
    outcomeId: string;
    signal?: AbortSignal;
}

function formatPolymarketOrderBook(data: Array<{ price: string; size: string }>): BetsOrderBookItem[] {
    return data.map((item) => {
        const size = Number.isNaN(+item.size) ? 0 : Number(item.size);

        return {
            size,
            price: Number.isNaN(+item.price) ? 0 : Number(item.price),
        };
    });
}

export async function getBetsMarketOrderBook(
    platform: PredictionPlatform,
    { market, outcomeId, signal }: Options,
): Promise<{
    bids: BetsOrderBookItem[];
    asks: BetsOrderBookItem[];
    lastPrice: number | null;
    spreads: number | null;
    showSpreadSetting: boolean;
}> {
    switch (platform) {
        case PredictionPlatform.Polymarket: {
            const [orderBookRes, lastPriceRes, spreadsRes] = await Promise.all([
                getPolymarketOrderBook(outcomeId, signal),
                getPolymarketLastPrice([outcomeId], signal),
                getPolymarketSpreads([outcomeId], signal),
            ]);
            const lastPriceStr = lastPriceRes.find((x) => x.token_id === outcomeId)?.price ?? null;
            const spreadsStr = has(spreadsRes, outcomeId) ? spreadsRes[outcomeId] : null;
            const lastPrice =
                lastPriceStr !== null ? (Number.isNaN(+lastPriceStr) ? null : Number(lastPriceStr)) : null;
            const spreads = spreadsStr !== null ? (Number.isNaN(+spreadsStr) ? null : Number(spreadsStr)) : null;

            if (!orderBookRes) {
                return {
                    bids: [],
                    asks: [],
                    lastPrice,
                    spreads,
                    showSpreadSetting: false,
                };
            }

            const bids = formatPolymarketOrderBook(orderBookRes.bids || []);
            const asks = formatPolymarketOrderBook(orderBookRes.asks || []);
            const hasIntegerPrices =
                bids.some((item) => Number.isInteger(item.price * 100)) ||
                asks.some((item) => Number.isInteger(item.price * 100));
            const hasFloatPrices =
                bids.some((item) => !Number.isInteger(item.price * 100)) ||
                asks.some((item) => !Number.isInteger(item.price * 100));

            return {
                bids,
                asks,
                lastPrice,
                spreads,
                showSpreadSetting: hasIntegerPrices && hasFloatPrices,
            };
        }
        case PredictionPlatform.Opinion: {
            throw new NotImplementedError();
        }
        default:
            unreachable(platform);
    }
}
