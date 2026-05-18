'use client';

import { PredictionPlatform } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import { Suspense } from 'react';

import { Loading } from '@/components/Loading.js';
import { PredictionProfilePositionList } from '@/components/Prediction/PredictionProfilePositionList.js';
import { PredictionTradeList } from '@/components/Prediction/PredictionTradeList.js';
import { Category, usePredictionProfileTab } from '@/hooks/prediction/usePredictionProfileTab.js';
import type { PredictionProfileDataForUI } from '@/types/prediction.js';

interface Props {
    platform: PredictionPlatform;
    predictionProfile: PredictionProfileDataForUI;
    address: string;
}

function PredictionProfileTabContentList({ platform, predictionProfile: profile, address }: Props) {
    const [currentTab] = usePredictionProfileTab();

    switch (currentTab) {
        case Category.Positions:
            return (
                <PredictionProfilePositionList
                    platform={platform}
                    address={address}
                    proxyAddress={profile.proxy}
                    predictionProfile={profile}
                />
            );
        case Category.Trades:
            return (
                <PredictionTradeList
                    platform={platform}
                    address={address}
                    proxyAddress={profile.proxy}
                    polymarketName={platform === PredictionPlatform.Polymarket ? profile.platform_name : undefined}
                    opinionName={platform === PredictionPlatform.Opinion ? profile.platform_name : undefined}
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
