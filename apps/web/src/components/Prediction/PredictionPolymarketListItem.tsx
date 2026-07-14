'use client';

import { PredictionPlatform } from '@dimensiondev/enums';
import { memo } from 'react';

import { BetItem } from '@/components/BetItem.js';
import { PredictionCryptoCell } from '@/components/Prediction/Category/PredictionCryptoCell.js';
import { PredictionSportsCell } from '@/components/Prediction/Category/PredictionSportsCell.js';
import { formatPolymarketEventListData } from '@/helpers/formatPolymarketEventListData.js';
import { formatPolymarketCryptoCellForUI } from '@/helpers/prediction/category/formatPolymarketCryptoCellForUI.js';
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
            <PredictionSportsCell
                className={sportsCellClassName}
                onLinkClick={onLinkClick}
                model={applySportsMarketPriceOverrides(model, liveMarketPrices)}
            />
        );
    }

    // Periodic crypto Up/Down markets (BTC/ETH/SOL/… 5m/15m/4h/hourly/daily/multistrike) render
    // the dedicated crypto cell; non-periodic markets fall through to the generic `BetItem`.
    const cryptoCell = formatPolymarketCryptoCellForUI(data);
    if (cryptoCell) {
        return <PredictionCryptoCell model={cryptoCell} className={sportsCellClassName} onLinkClick={onLinkClick} />;
    }

    return (
        <BetItem
            event={formatPolymarketEventListData(data)}
            openLinkInNewTab={false}
            platform={PredictionPlatform.Polymarket}
            onLinkClick={onLinkClick}
        />
    );
});
