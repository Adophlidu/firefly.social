'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { Suspense, useCallback, useState } from 'react';

import { BetsLeaderboardContent } from '@/components/Bets/BetsLeaderboardContent.js';
import { BetsLeaderboardFilters } from '@/components/Bets/BetsLeaderboardFilters.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { Loading } from '@/components/Loading.js';
import { BetsLeaderboardTab, PolymarketRankOrder, PolymarketRankPeriod } from '@/constants/enum.js';

export default function BetsLeaderboardPage() {
    const [tab, setTab] = useState<BetsLeaderboardTab>(BetsLeaderboardTab.Global);
    const [period, setPeriod] = useState<PolymarketRankPeriod>(PolymarketRankPeriod.OneDay);
    const [order, setOrder] = useState<PolymarketRankOrder>(PolymarketRankOrder.Pnl);

    const handleTabChange = useCallback((tab: BetsLeaderboardTab) => {
        setTab(tab);
        setPeriod(PolymarketRankPeriod.OneDay);
        setOrder(PolymarketRankOrder.Pnl);
    }, []);

    return (
        <div className="flex flex-col gap-4">
            <div className="border-b border-line bg-primaryBottom">
                <nav className="flex items-center gap-1.5 px-4">
                    <div className="flex flex-col">
                        <ClickableButton
                            onClick={() => handleTabChange(BetsLeaderboardTab.Global)}
                            className={classNames(
                                'flex h-[45px] items-center whitespace-nowrap px-3 font-extrabold transition-all hover:text-highlight',
                                tab === BetsLeaderboardTab.Global ? 'text-highlight' : 'text-third',
                            )}
                        >
                            <Trans>Global</Trans>
                        </ClickableButton>
                        {tab === BetsLeaderboardTab.Global ? (
                            <span className="h-1 w-full bg-highlight transition-all" />
                        ) : null}
                    </div>
                    <div className="flex flex-col">
                        <ClickableButton
                            onClick={() => handleTabChange(BetsLeaderboardTab.Following)}
                            className={classNames(
                                'flex h-[45px] items-center whitespace-nowrap px-3 font-extrabold transition-all hover:text-highlight',
                                tab === BetsLeaderboardTab.Following ? 'text-highlight' : 'text-third',
                            )}
                        >
                            <Trans>Following</Trans>
                        </ClickableButton>
                        {tab === BetsLeaderboardTab.Following ? (
                            <span className="h-1 w-full bg-highlight transition-all" />
                        ) : null}
                    </div>
                </nav>
            </div>
            <div className="flex flex-col gap-4 p-3">
                <BetsLeaderboardFilters
                    period={period}
                    order={order}
                    onPeriodChange={setPeriod}
                    onOrderChange={setOrder}
                    isGlobal={tab === BetsLeaderboardTab.Global}
                />
                <Suspense fallback={<Loading />}>
                    <BetsLeaderboardContent tab={tab} period={period} order={order} />
                </Suspense>
            </div>
        </div>
    );
}
