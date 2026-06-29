'use client';

import { PredictionPlatform } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo, type ReactNode, useMemo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Link } from '@/components/Link.js';
import { openPredictionPage } from '@/helpers/openPredictionPage.js';
import type { FifaBracketMatch, FifaBracketTeam } from '@/helpers/prediction/category/bracket/types.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { useLocalizedSportsTeamName } from '@/hooks/prediction/useLocalizedSportsTeamName.js';
import { useLocale } from '@/hooks/useLocale.js';
import { capturePolymarketOrderClick } from '@/providers/telemetry/capturePolymarketEvent.js';

interface Props {
    match: FifaBracketMatch;
}

/** Polymarket "live" red, used for the LIVE badge + dot. */
const LIVE_COLOR = '#ff564d';

function TeamSide({
    team,
    score,
    hasScore,
    dimmed,
    localize,
}: {
    team: FifaBracketTeam | null;
    score: number | null;
    hasScore: boolean;
    dimmed: boolean;
    localize: (name: string) => string;
}) {
    return (
        <div className={classNames('flex items-center justify-between', { 'opacity-40': dimmed })}>
            <div className="flex min-w-0 items-center gap-3">
                {team?.flagUrl ? (
                    <img src={team.flagUrl} alt="" className="h-[30px] w-[45px] shrink-0 rounded object-cover" />
                ) : (
                    <span className="h-[30px] w-[45px] shrink-0 rounded-lg bg-bg" />
                )}
                <span className="line-clamp-2 min-w-0 flex-1 break-words text-sm font-semibold leading-4 text-main">
                    {team ? localize(team.name) : <Trans>TBD</Trans>}
                </span>
            </div>
            <div className="flex h-9 w-10 shrink-0 items-center justify-center rounded-lg">
                {hasScore && score !== null ? <span className="text-sm font-bold text-main">{score}</span> : null}
            </div>
        </div>
    );
}

export const PredictionBracketMatchCard = memo<Props>(function PredictionBracketMatchCard({ match }) {
    const localize = useLocalizedSportsTeamName();
    const locale = useLocale();
    const marketSlug = match.marketSlugs.find((slug): slug is string => !!slug);

    const isFinal = match.status === 'final';
    const isLive = match.status === 'live';
    const hasScores = match.scores !== null;
    // Winner side (higher score) — only when finalized and decisive; ties leave both sides undimmed.
    const winnerSide =
        isFinal && match.scores && match.scores[0] !== match.scores[1]
            ? match.scores[0] > match.scores[1]
                ? 0
                : 1
            : null;

    const dateLabel = useMemo(() => {
        if (!match.startTime) return null;
        const date = new Date(match.startTime);
        if (Number.isNaN(date.getTime())) return null;
        return new Intl.DateTimeFormat(locale, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        }).format(date);
    }, [match.startTime, locale]);

    const winnerTeam = winnerSide !== null ? match.teams[winnerSide] : null;

    let header: ReactNode;
    if (isLive) {
        header = (
            <div className="flex h-8 items-center gap-2 text-[13px] font-medium" style={{ color: LIVE_COLOR }}>
                <Trans>LIVE</Trans>
                <span aria-hidden>●</span>
            </div>
        );
    } else if (isFinal) {
        header = (
            <div className="flex h-8 items-center justify-center gap-2">
                {winnerTeam?.flagUrl ? (
                    <img src={winnerTeam.flagUrl} alt="" className="h-5 w-[30px] rounded object-cover" />
                ) : null}
                <span className="text-[13px] font-medium text-main">
                    <Trans>Advances</Trans>
                </span>
            </div>
        );
    } else {
        header = (
            <div className="flex h-8 items-center">
                {dateLabel ? (
                    <span className="flex h-7 items-center rounded-lg bg-bg px-2 text-[13px] font-semibold text-main">
                        {dateLabel}
                    </span>
                ) : (
                    <span className="h-7" />
                )}
            </div>
        );
    }

    const content = (
        <div className="flex flex-col gap-3 rounded-xl border border-secondaryLine bg-lightBottom p-3 dark:bg-darkBottom">
            {header}
            <TeamSide
                team={match.teams[0]}
                score={match.scores?.[0] ?? null}
                hasScore={hasScores}
                dimmed={winnerSide === 1}
                localize={localize}
            />
            <TeamSide
                team={match.teams[1]}
                score={match.scores?.[1] ?? null}
                hasScore={hasScores}
                dimmed={winnerSide === 0}
                localize={localize}
            />
        </div>
    );

    // event_slug first → web event detail page; else a market slug → bet (iframe wallet); else non-clickable.
    if (match.eventSlug) {
        return (
            <Link
                href={RouteResolver.betsEventDetail(PredictionPlatform.Polymarket, match.eventSlug)}
                className="block w-full text-left"
                data-prevent-progress
            >
                {content}
            </Link>
        );
    }

    if (!marketSlug) return content;

    return (
        <ClickableButton
            className="block w-full text-left"
            data-prevent-progress
            onClick={() => {
                capturePolymarketOrderClick(marketSlug, 0);
                void openPredictionPage(marketSlug, { outcome: 0 });
            }}
        >
            {content}
        </ClickableButton>
    );
});
