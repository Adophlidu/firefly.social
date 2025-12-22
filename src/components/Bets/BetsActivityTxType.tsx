'use client';

import { safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import type { PropsWithChildren } from 'react';

import BuyIcon from '@/assets/bet-buy.svg';
import SellIcon from '@/assets/bet-sell.svg';
import { ActivityCellAction } from '@/components/ActivityCell/ActivityCellAction.js';
import { ActivityCellActionTag } from '@/components/ActivityCell/ActivityCellActionTag.js';
import { BetsName } from '@/components/Bets/BetsName.js';
import { BetsPlatform, PolymarketBetType } from '@/constants/enum.js';
import { toFixedTrimmed } from '@/helpers/polymarket.js';

interface Props {
    type: PolymarketBetType;
    usdcSize: string;
    platform: BetsPlatform;
}

export function BetsActivityTxType({ type, platform, children, usdcSize }: PropsWithChildren<Props>) {
    switch (type) {
        case PolymarketBetType.Buy:
            return (
                <ActivityCellAction>
                    <Trans>
                        <ActivityCellActionTag icon={<BuyIcon />}>Placed a bet</ActivityCellActionTag>
                        <span>
                            worth ${toFixedTrimmed(+usdcSize, 2)} at <BetsName platform={platform} />
                        </span>
                    </Trans>
                    {children}
                </ActivityCellAction>
            );
        case PolymarketBetType.Sell:
            return (
                <ActivityCellAction>
                    <Trans>
                        <ActivityCellActionTag icon={<SellIcon />}>Sold a bet</ActivityCellActionTag>
                        <span>
                            worth ${toFixedTrimmed(+usdcSize, 2)} at <BetsName platform={platform} />
                        </span>
                    </Trans>
                    {children}
                </ActivityCellAction>
            );
        default:
            safeUnreachable(type);
            return null;
    }
}
