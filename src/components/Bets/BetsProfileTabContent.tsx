'use client';

import { safeUnreachable } from '@dimensiondev/utils';
import { Suspense } from 'react';

import { BetsProfilePositionList } from '@/components/Bets/BetsProfilePositionList.js';
import { BetsTradeList } from '@/components/Bets/BetsTradeList.js';
import { Loading } from '@/components/Loading.js';
import type { BetsPlatform } from '@/constants/enum.js';
import { Category, useBetsProfileTab } from '@/hooks/bets/useBetsProfileTab.js';

interface Props {
    platform: BetsPlatform;
    address: string;
    proxyAddress?: string;
}

function BetsProfileTabContentList({ platform, address, proxyAddress }: Props) {
    const [currentTab] = useBetsProfileTab();

    switch (currentTab) {
        case Category.Positions:
            return <BetsProfilePositionList platform={platform} address={address} proxyAddress={proxyAddress} />;
        case Category.Trades:
            return <BetsTradeList platform={platform} address={address} />;
        default:
            safeUnreachable(currentTab);
            return null;
    }
}

export function BetsProfileTabContent(props: Props) {
    return (
        <Suspense fallback={<Loading />}>
            <BetsProfileTabContentList {...props} />
        </Suspense>
    );
}
