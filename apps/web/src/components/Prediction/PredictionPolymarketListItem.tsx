'use client';

import { PredictionPlatform } from '@dimensiondev/enums';
import { memo } from 'react';

import { BetItem } from '@/components/BetItem.js';
import { PredictionSportsCell } from '@/components/Prediction/Category/PredictionSportsCell.js';
import { formatPolymarketEventListData } from '@/helpers/formatPolymarketEventListData.js';
import { formatPolymarketSportsEventForUI } from '@/helpers/prediction/category/formatPolymarketSportsEventForUI.js';
import { applySportsMarketPriceOverrides } from '@/helpers/prediction/category/sportsMarketLivePrices.js';
import type { PolymarketEventListData, PolymarketSportsEvent } from '@/providers/types/Firefly.js';

interface Props {
    data: PolymarketEventListData;
    liveMarketPrices: Record<string, string>;
    sportsCellClassName?: string;
    onLinkClick?: () => void;
}

export const PredictionPolymarketListItem = memo<Props>(function PredictionPolymarketListItem({
    data,
    liveMarketPrices,
    sportsCellClassName,
    onLinkClick,
}) {
    const sportsEvent = data as PolymarketSportsEvent;
    const model = formatPolymarketSportsEventForUI(sportsEvent);

    if (model) {
        return (
            <div className="pb-3">
                <PredictionSportsCell
                    className={sportsCellClassName}
                    onLinkClick={onLinkClick}
                    model={applySportsMarketPriceOverrides(model, liveMarketPrices)}
                />
            </div>
        );
    }

    return (
        <div className="pb-3">
            <BetItem
                event={formatPolymarketEventListData(data)}
                openLinkInNewTab={false}
                platform={PredictionPlatform.Polymarket}
                onLinkClick={onLinkClick}
            />
        </div>
    );
});
