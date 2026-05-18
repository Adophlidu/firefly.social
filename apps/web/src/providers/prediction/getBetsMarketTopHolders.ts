import { PredictionPlatform } from '@dimensiondev/enums';
import { unreachable } from '@dimensiondev/utils';
import { createIndicator, type PageIndicator } from '@dimensiondev/utils';

import {
    getOpinionBetsTopHolders,
    getPolymarketBetsTopHolders,
} from '@/providers/firefly/prediction/getBetsTopHolders.js';
import type { PolymarketHolder } from '@/providers/prediction/polymarket/type.js';
import type { OpinionHolder } from '@/providers/types/Firefly.js';
import type { BetsMarketDataForUI, BetsMarketOutcome, BetsTopHolderForUI } from '@/types/prediction.js';

interface Options {
    market: BetsMarketDataForUI;
    signal?: AbortSignal;
    indicator?: PageIndicator;
}

function formatPolymarketHolders(holder: PolymarketHolder): BetsTopHolderForUI {
    return {
        wallet: holder.proxyWallet,
        shares: holder.amount,
        name: holder.name.toLowerCase().startsWith(`${holder.proxyWallet.toLowerCase()}-`) ? undefined : holder.name,
        avatar: holder.profileImageOptimized || holder.profileImage,
    };
}
function formatOpinionHolder(holder: OpinionHolder): BetsTopHolderForUI {
    return {
        wallet: holder.proxy || holder.walletAddress,
        shares: Number(holder.sharesAmount),
        name: holder.userName,
        avatar: holder.avatar,
    };
}

export async function getBetsMarketTopHolders(
    platform: PredictionPlatform,
    { market, signal, indicator = createIndicator() }: Options,
): Promise<
    Array<{
        outcome: BetsMarketOutcome;
        holders: BetsTopHolderForUI[];
    }>
> {
    switch (platform) {
        case PredictionPlatform.Polymarket: {
            const allHolders = await getPolymarketBetsTopHolders({
                id: market.conditionId,
                indicator,
                outcome: '',
                limit: 20,
                signal,
            });
            return market.outcomes.map((x) => {
                const holders = (allHolders?.find((item) => item.token === x.id)?.holders || []).map(
                    formatPolymarketHolders,
                );
                return { outcome: x, holders };
            });
        }
        case PredictionPlatform.Opinion: {
            const data = await Promise.all(
                market.outcomes.map(async (outcome) =>
                    getOpinionBetsTopHolders({
                        id: market.id,
                        outcome: outcome.id,
                        limit: 20,
                        indicator,
                        signal,
                    }),
                ),
            );
            return market.outcomes.map((x, i) => ({
                outcome: x,
                holders: (data[i]?.data || []).map(formatOpinionHolder),
            }));
        }
        default:
            unreachable(platform);
    }
}
