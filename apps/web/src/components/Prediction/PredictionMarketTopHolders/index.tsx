'use client';

import { first } from 'lodash-es';
import { memo, useMemo, useState } from 'react';

import { PredictionMarketFilter } from '@/components/Prediction/PredictionMarketTopHolders/PredictionMarketFilter.js';
import { TopHoldersContent } from '@/components/Prediction/PredictionMarketTopHolders/TopHoldersContent.js';
import type { PredictionPlatform } from '@/constants/enum.js';
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
    const [marketId, setMarketId] = useState(first(markets)?.id || '');

    const market = useMemo(() => markets.find((x) => x.id === marketId), [marketId, markets]);

    if (!market) return null;

    return (
        <div className="space-y-4 pb-4">
            {markets.length > 1 ? (
                <PredictionMarketFilter
                    markets={markets}
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
