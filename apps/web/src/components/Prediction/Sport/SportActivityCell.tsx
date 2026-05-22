'use client';

import { memo } from 'react';

import { SportBuyButtons } from '@/components/Prediction/Sport/SportBuyButtons.js';
import { SportCellFooter } from '@/components/Prediction/Sport/SportCellFooter.js';
import { SportFinalScore } from '@/components/Prediction/Sport/SportFinalScore.js';
import { SportLiveScore } from '@/components/Prediction/Sport/SportLiveScore.js';
import { SportScoreBar } from '@/components/Prediction/Sport/SportScoreBar.js';
import { SportTeamDisplay } from '@/components/Prediction/Sport/SportTeamDisplay.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

interface SportActivityCellProps {
    event: BetsEventDataForUI;
}

export const SportActivityCell = memo(function SportActivityCell({ event }: SportActivityCellProps) {
    const sport = event.sportData;
    if (!sport) return null;

    const { homeTeam, awayTeam, scores, live, ended, period, startTime, isDraw, winResult, leagueName, scoreType } =
        sport;
    const primaryMarket = event.markets[0];
    const homePrice = Number.parseFloat(primaryMarket?.outcomes[0]?.price || '0');
    const awayPrice = Number.parseFloat(primaryMarket?.outcomes[1]?.price || '0');
    const drawPrice =
        isDraw && primaryMarket?.outcomes[2] ? Number.parseFloat(primaryMarket.outcomes[2].price || '0') : undefined;

    return (
        <div className="flex flex-col gap-2.5">
            <SportTeamDisplay homeTeam={homeTeam} awayTeam={awayTeam} />

            {live ? (
                <SportLiveScore scores={scores} period={period} />
            ) : ended ? (
                <SportFinalScore
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                    scores={scores}
                    scoreType={scoreType}
                    winResult={winResult}
                />
            ) : (
                <SportScoreBar
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                    homePrice={homePrice}
                    awayPrice={awayPrice}
                    drawPrice={drawPrice}
                />
            )}

            {!ended && primaryMarket ? (
                <SportBuyButtons market={primaryMarket} homeTeam={homeTeam} awayTeam={awayTeam} showDraw={isDraw} />
            ) : null}

            <SportCellFooter startTime={startTime || event.startTime} volume={event.volume} leagueName={leagueName} />
        </div>
    );
});
