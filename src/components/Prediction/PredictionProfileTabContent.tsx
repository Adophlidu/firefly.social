'use client';

import { safeUnreachable } from '@dimensiondev/utils';
import { Suspense } from 'react';

import { Loading } from '@/components/Loading.js';
import { PredictionProfilePositionList } from '@/components/Prediction/PredictionProfilePositionList.js';
import { PredictionTradeList } from '@/components/Prediction/PredictionTradeList.js';
import { PredictionPlatform } from '@/constants/enum.js';
import { Category, usePredictionProfileTab } from '@/hooks/prediction/usePredictionProfileTab.js';

interface Props {
    platform: PredictionPlatform;
    address: string;
    proxyAddress?: string;
    platformName?: string;
}

function PredictionProfileTabContentList({ platform, address, proxyAddress, platformName }: Props) {
    const [currentTab] = usePredictionProfileTab();

    switch (currentTab) {
        case Category.Positions:
            return <PredictionProfilePositionList platform={platform} address={address} proxyAddress={proxyAddress} />;
        case Category.Trades:
            return (
                <PredictionTradeList
                    platform={platform}
                    address={address}
                    proxyAddress={proxyAddress}
                    polymarketName={platform === PredictionPlatform.Polymarket ? platformName : undefined}
                    opinionName={platform === PredictionPlatform.Opinion ? platformName : undefined}
                />
            );
        default:
            safeUnreachable(currentTab);
            return null;
    }
}

export function PredictionProfileTabContent(props: Props) {
    return (
        <Suspense fallback={<Loading />}>
            <PredictionProfileTabContentList {...props} />
        </Suspense>
    );
}
