'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { Suspense, useCallback, useState } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Loading } from '@/components/Loading.js';
import { PredictionLeaderboardContent } from '@/components/Prediction/PredictionLeaderboardContent.js';
import { PredictionLeaderboardFilters } from '@/components/Prediction/PredictionLeaderboardFilters.js';
import { BetsLeaderboardTab, PolymarketRankOrder, PolymarketRankPeriod } from '@/constants/enum.js';
import { useBetsLeaderboardStore } from '@/store/useBetsLeaderboardStore.js';

export default function BetsLeaderboardPage() {
    const tab = useBetsLeaderboardStore.use.tab();
    const setTab = useBetsLeaderboardStore.use.setTab();

    const [period, setPeriod] = useState<PolymarketRankPeriod>(PolymarketRankPeriod.All);
    const [order, setOrder] = useState<PolymarketRankOrder>(PolymarketRankOrder.Pnl);

    const handleTabChange = useCallback(
        (newTab: BetsLeaderboardTab) => {
            setTab(newTab);
            setPeriod(PolymarketRankPeriod.All);
            setOrder(PolymarketRankOrder.Pnl);
        },
        [setTab],
    );

    return (
        <div className="flex flex-col gap-4">
            <div className="border-line bg-primaryBottom border-b">
                <nav className="flex items-center gap-1.5 px-4">
                    <div className="flex flex-col">
                        <ClickableButton
                            onClick={() => handleTabChange(BetsLeaderboardTab.Global)}
                            className={classNames(
                                'hover:text-highlight flex h-[45px] items-center whitespace-nowrap px-3 font-extrabold transition-all',
                                tab === BetsLeaderboardTab.Global ? 'text-highlight' : 'text-third',
                            )}
                        >
                            <Trans>Global</Trans>
                        </ClickableButton>
                        {tab === BetsLeaderboardTab.Global ? (
                            <span className="bg-highlight h-1 w-full transition-all" />
                        ) : null}
                    </div>
                    <div className="flex flex-col">
                        <ClickableButton
                            onClick={() => handleTabChange(BetsLeaderboardTab.Following)}
                            className={classNames(
                                'hover:text-highlight flex h-[45px] items-center whitespace-nowrap px-3 font-extrabold transition-all',
                                tab === BetsLeaderboardTab.Following ? 'text-highlight' : 'text-third',
                            )}
                        >
                            <Trans>Following</Trans>
                        </ClickableButton>
                        {tab === BetsLeaderboardTab.Following ? (
                            <span className="bg-highlight h-1 w-full transition-all" />
                        ) : null}
                    </div>
                </nav>
            </div>
            <div className="flex flex-col gap-4 p-3">
                <PredictionLeaderboardFilters
                    period={period}
                    order={order}
                    onPeriodChange={setPeriod}
                    onOrderChange={setOrder}
                    isGlobal={tab === BetsLeaderboardTab.Global}
                />
                <Suspense fallback={<Loading />}>
                    <PredictionLeaderboardContent tab={tab} period={period} order={order} />
                </Suspense>
            </div>
        </div>
    );
}
