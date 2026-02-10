'use client';

import { safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { type PropsWithChildren } from 'react';

import BuyIcon from '@/assets/bet-buy.svg';
import SellIcon from '@/assets/bet-sell.svg';
import { ActivityCellActionTag } from '@/components/ActivityCell/ActivityCellActionTag.js';
import { PredictionPlatformName } from '@/components/Prediction/PredictionPlatformName.js';
import { PolymarketBetType, type PredictionPlatform } from '@/constants/enum.js';
import { toFixedTrimmed } from '@/helpers/polymarket.js';

interface Props {
    type: PolymarketBetType;
    usdcSize: string;
    platform: PredictionPlatform;
}

export function PredictionActivityTxType({ type, platform, children, usdcSize }: PropsWithChildren<Props>) {
    switch (type) {
        case PolymarketBetType.Buy:
            return (
                <div className="text-sm font-normal">
                    <Trans>
                        <ActivityCellActionTag className="mr-1 !inline-flex" icon={<BuyIcon />}>
                            Made a prediction
                        </ActivityCellActionTag>
                        <span>
                            worth ${toFixedTrimmed(+usdcSize, 2)} at <PredictionPlatformName platform={platform} />
                        </span>
                    </Trans>
                    {children}
                </div>
            );
        case PolymarketBetType.Sell:
            return (
                <div className="text-sm font-normal">
                    <Trans>
                        <ActivityCellActionTag className="mr-1 !inline-flex" icon={<SellIcon />}>
                            Sold a position
                        </ActivityCellActionTag>
                        <span>
                            worth ${toFixedTrimmed(+usdcSize, 2)} at <PredictionPlatformName platform={platform} />
                        </span>
                    </Trans>
                    {children}
                </div>
            );
        default:
            safeUnreachable(type);
            return null;
    }
}
