'use client';

import type { PredictionPlatform } from '@dimensiondev/enums';
import { first } from 'lodash-es';
import { memo, useMemo, useState } from 'react';

import { PredictionMarketFilter } from '@/components/Prediction/PredictionMarketTopHolders/PredictionMarketFilter.js';
import { TopHoldersContent } from '@/components/Prediction/PredictionMarketTopHolders/TopHoldersContent.js';
import type { BetsMarketDataForUI } from '@/types/prediction.js';

interface PredictionMarketTopHoldersProps {
    platform: PredictionPlatform;
    markets: BetsMarketDataForUI[];
    eventSlug?: string;
    eventTitle?: string;
}

export const PredictionMarketTopHolders = memo<PredictionMarketTopHoldersProps>(function PredictionMarketTopHolders({
    platform,
    markets,
    eventSlug,
    eventTitle,
}) {
    // A three-way soccer moneyline is merged into one combined market for the odds display, but Top Holders
    // shows per-market Yes/No holders. Expand it back into the original markets (Home / Draw / Away) so the
    // filter lists each one and the holder columns below reflect the selected market.
    const expandedMarkets = useMemo(
        () =>
            markets.flatMap((market) =>
                market.originalMoneylineMarkets?.length ? market.originalMoneylineMarkets : [market],
            ),
        [markets],
    );

    const [marketId, setMarketId] = useState(first(expandedMarkets)?.id || '');

    const market = useMemo(() => expandedMarkets.find((x) => x.id === marketId), [marketId, expandedMarkets]);

    if (!market) return null;

    return (
        <div className="space-y-4 pb-4">
            {expandedMarkets.length > 1 ? (
                <PredictionMarketFilter
                    markets={expandedMarkets}
                    marketId={marketId}
                    onSelect={setMarketId}
                    eventSlug={eventSlug}
                    eventTitle={eventTitle}
                />
            ) : null}
            <TopHoldersContent platform={platform} market={market} />
        </div>
    );
});
