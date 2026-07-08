'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo, type ReactNode } from 'react';

import { TextOverflowTooltip } from '@/components/TextOverflowTooltip.js';
import { bedStead } from '@/fonts/bedStead/index.js';
import { getResolvedSportOutcome } from '@/helpers/prediction/sportScoreUtils.js';
import type { BetsMarketDataForUI, PenaltyShootout, SportScore, SportTeam } from '@/types/prediction.js';
import { SportMarketGroupType } from '@/types/prediction.js';

interface SportMarketResultLabelProps {
    market: BetsMarketDataForUI;
    renderAs: SportMarketGroupType;
    homeTeam?: SportTeam;
    awayTeam?: SportTeam;
    scores: SportScore[];
    winResult?: number;
    penaltyShootout?: PenaltyShootout;
}

/**
 * Right-side resolved-result label shown in place of SportBuyButtons once a game sub-market can no
 * longer be traded (game ended / market resolved). Mirrors the resolved treatment of non-game
 * prediction markets (PredictionMarketList): bedStead font, team color for team markets, green/red
 * for Over-Under and Yes-No outcomes.
 */
export const SportMarketResultLabel = memo(function SportMarketResultLabel({
    market,
    renderAs,
    homeTeam,
    awayTeam,
    scores,
    winResult,
    penaltyShootout,
}: SportMarketResultLabelProps) {
    const result = getResolvedSportOutcome(market, renderAs, {
        scores,
        winResult,
        penaltyShootout,
        homeTeam,
        awayTeam,
    });
    if (!result) return null;

    const outcome = market.outcomes[result.index];
    if (!outcome) return null;

    const isTeamMarket = renderAs === SportMarketGroupType.Moneyline || renderAs === SportMarketGroupType.Spread;

    let label: ReactNode;
    let colorClassName: string | undefined;
    let style: { color?: string } | undefined;

    if (isTeamMarket) {
        if (result.team) {
            // Winning team name in the team's color (fall back to danger when the color is missing).
            label = result.team.name || outcome.label;
            if (result.team.color) {
                style = { color: result.team.color };
            } else {
                colorClassName = 'text-danger';
            }
        } else {
            // No team matched → the Draw leg of a 3-way moneyline (or, rarely, an unmatched label).
            // Render neutrally so a resolved Draw is not painted red like a losing team.
            const normalized = outcome.label.trim().toLowerCase();
            label = normalized === 'draw' ? <Trans>Draw</Trans> : outcome.label;
            colorClassName = 'text-second';
        }
    } else if (renderAs === SportMarketGroupType.Total) {
        // Render the full Over/Under word; color follows the winning side, independent of outcome order.
        const trimmed = outcome.label.trim();
        const isOver = /^o/i.test(trimmed);
        const isUnder = /^u/i.test(trimmed);
        if (isOver || isUnder) {
            label = isOver ? <Trans>Over</Trans> : <Trans>Under</Trans>;
            colorClassName = isOver ? 'text-success' : 'text-danger';
        } else {
            label = outcome.label;
            colorClassName = 'text-second';
        }
    } else {
        // Other (e.g. BTTS): Yes/No. Yes=success, No=danger; raw label + neutral color otherwise.
        const normalized = outcome.label.trim().toLowerCase();
        const isYes = normalized === 'yes';
        const isNo = normalized === 'no';
        if (isYes || isNo) {
            label = isYes ? <Trans>Yes</Trans> : <Trans>No</Trans>;
            colorClassName = isYes ? 'text-success' : 'text-danger';
        } else {
            label = outcome.label;
            colorClassName = 'text-second';
        }
    }

    // Hide the slot when the resolved label string is empty (e.g. an empty outcome label).
    if (typeof label === 'string' && !label.trim()) return null;

    return (
        <div className="flex shrink-0 items-center justify-end max-md:w-full">
            <TextOverflowTooltip content={<span className="text-sm font-bold">{label}</span>}>
                {(ref) => (
                    <span
                        ref={ref}
                        className={classNames(
                            'max-w-[160px] truncate text-base font-bold leading-6',
                            bedStead.className,
                            colorClassName,
                        )}
                        style={style}
                    >
                        {label}
                    </span>
                )}
            </TextOverflowTooltip>
        </div>
    );
});
