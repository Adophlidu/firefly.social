'use client';

import BuyIcon from '@dimensiondev/assets/bet-buy.svg';
import SellIcon from '@dimensiondev/assets/bet-sell.svg';
import type { PredictionPlatform } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import type { PropsWithChildren } from 'react';

import { ActivityCellActionTag } from '@/components/ActivityCell/ActivityCellActionTag.js';
import { PredictionPlatformName } from '@/components/Prediction/PredictionPlatformName.js';
import { PolymarketBetType } from '@/constants/enum.js';
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
