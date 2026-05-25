'use client';

import { PredictionPlatform } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { first } from 'lodash-es';
import { memo, useState } from 'react';

import { Loading } from '@/components/Loading.js';
import { Tab, Tabs } from '@/components/Tabs/index.js';
import { IS_APPLE, IS_SAFARI } from '@/constants/browser.js';
import { dynamic } from '@/esm/dynamic.js';
import type { BetsMarketDataForUI } from '@/types/prediction.js';

const PredictionMarketOrderBook = dynamic(
    () =>
        import('@/components/Prediction/PredictionMarketOrderBook/index.js').then(
            (mod) => mod.PredictionMarketOrderBook,
        ),
    { ssr: false, loading: () => <Loading minHeight={282} /> },
);
const PredictionMarketsPriceLineChart = dynamic(
    () =>
        import('@/components/Prediction/PredictionMarketsPriceLineChart/index.js').then(
            (mod) => mod.PredictionMarketsPriceLineChart,
        ),
    { ssr: false, loading: () => <Loading minHeight={282} /> },
);
const PredictionMarketResolution = dynamic(
    () => import('@/components/Prediction/PredictionMarketResolution.js').then((mod) => mod.PredictionMarketResolution),
    { ssr: false, loading: () => <Loading minHeight={282} /> },
);

interface Props {
    market: BetsMarketDataForUI;
    platform: PredictionPlatform;
}

enum SingleMarketTabType {
    OrderBook = 'order-book',
    PriceChart = 'price-chart',
    Resolution = 'resolution',
}

function getAvailableTabs(market: BetsMarketDataForUI, platform: PredictionPlatform) {
    if (
        platform === PredictionPlatform.Opinion ||
        ((market.isResolved || market.isClosed) && !market.statusList?.length)
    )
        return [
            {
                value: SingleMarketTabType.PriceChart,
                label: <Trans>Graph</Trans>,
            },
        ];

    if (market.isResolved || market.isClosed)
        return [
            {
                value: SingleMarketTabType.PriceChart,
                label: <Trans>Graph</Trans>,
            },
            {
                value: SingleMarketTabType.Resolution,
                label: <Trans>Resolution</Trans>,
            },
        ];

    return [
        {
            value: SingleMarketTabType.OrderBook,
            label: <Trans>Order Book</Trans>,
        },
        {
            value: SingleMarketTabType.PriceChart,
            label: <Trans>Graph</Trans>,
        },
    ];
}

export const PredictionSingleMarketTab = memo<Props>(function PredictionSingleMarketTab({ market, platform }) {
    const [activeTab, setActiveTab] = useState<SingleMarketTabType | undefined>(
        first(getAvailableTabs(market, platform))?.value,
    );

    return (
        <div>
            <Tabs
                value={activeTab}
                onChange={setActiveTab}
                className={classNames(
                    'sticky z-30 mt-4 bg-primaryBottom px-4',
                    IS_APPLE && IS_SAFARI ? 'top-[53px]' : 'top-[54px]',
                )}
                variant="main"
            >
                {getAvailableTabs(market, platform).map((tab) => (
                    <Tab value={tab.value} key={tab.value}>
                        {tab.label}
                    </Tab>
                ))}
            </Tabs>
            <div>
                {activeTab === SingleMarketTabType.OrderBook ? (
                    <div className="p-4">
                        <PredictionMarketOrderBook market={market} platform={platform} />
                    </div>
                ) : null}
                {activeTab === SingleMarketTabType.PriceChart ? (
                    <PredictionMarketsPriceLineChart
                        markets={[market]}
                        platform={platform}
                        showBuyButtons={false}
                        isActive
                        filterResolvedMarkets={false}
                    />
                ) : null}
                {activeTab === SingleMarketTabType.Resolution ? <PredictionMarketResolution market={market} /> : null}
            </div>
        </div>
    );
});
