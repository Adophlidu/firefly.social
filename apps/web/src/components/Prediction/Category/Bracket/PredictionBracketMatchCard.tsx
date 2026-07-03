'use client';

import { PredictionPlatform } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { type CSSProperties, memo, type ReactNode, useMemo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Link } from '@/components/Link.js';
import { getReadableTextColor } from '@/helpers/getReadableTextColor.js';
import { openPredictionPage } from '@/helpers/openPredictionPage.js';
import type { FifaBracketMatch, FifaBracketTeam } from '@/helpers/prediction/category/bracket/types.js';
import { formatPercent } from '@/helpers/prediction/category/fifaGroups.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { useLocalizedSportsTeamName } from '@/hooks/prediction/useLocalizedSportsTeamName.js';
import { useLocale } from '@/hooks/useLocale.js';
import { capturePolymarketOrderClick } from '@/providers/telemetry/capturePolymarketEvent.js';

interface Props {
    match: FifaBracketMatch;
    /**
     * TEMPORARY: inferred winner side for finalized draws decided on penalties (see
     * inferBracketWinners). Omitted/null keeps today's behavior for non-draws and undecided ties.
     * TODO: replace once the backend exposes penalty/winner data on the match itself.
     */
    inferredWinnerSide?: 0 | 1 | null;
}

/** Polymarket "live" red, used for the LIVE badge + dot. */
const LIVE_COLOR = '#ff564d';

/** Win-rate badge filled with the team's national color; non-interactive (the card wraps it). */
function PercentBadge({ team, percent }: { team: FifaBracketTeam | null; percent: number }) {
    const color = team?.teamColor.trim();
    const style: CSSProperties | undefined = color
        ? { backgroundColor: color, color: getReadableTextColor(color) }
        : undefined;
    return (
        <span
            className={classNames(
                'flex h-6 w-12 shrink-0 items-center justify-center rounded-lg text-xs font-medium md:h-8 md:w-[66px] md:text-[13px]',
                color ? '' : 'bg-highlight',
            )}
            style={style}
        >
            {formatPercent(percent)}
        </span>
    );
}

function TeamSide({
    team,
    score,
    hasScore,
    percent,
    dimmed,
    localize,
}: {
    team: FifaBracketTeam | null;
    score: number | null;
    hasScore: boolean;
    percent: number | null;
    dimmed: boolean;
    localize: (name: string) => string;
}) {
    return (
        <div className={classNames('flex items-center justify-between', { 'opacity-40': dimmed })}>
            <div className="flex min-w-0 items-center gap-2 md:gap-3">
                {team?.flagUrl ? (
                    <img
                        src={team.flagUrl}
                        alt=""
                        className="h-6 w-9 shrink-0 rounded object-cover md:h-[30px] md:w-[45px]"
                    />
                ) : (
                    <span className="h-6 w-9 shrink-0 rounded-lg bg-bg md:h-[30px] md:w-[45px]" />
                )}
                <span className="line-clamp-2 min-w-0 flex-1 break-words text-xs font-semibold leading-4 text-main md:text-[14px]">
                    {team ? localize(team.name) : <Trans>TBD</Trans>}
                </span>
            </div>
            {hasScore && score !== null ? (
                <span className="flex size-6 shrink-0 items-center justify-center text-sm font-bold text-main md:size-8">
                    {score}
                </span>
            ) : percent !== null ? (
                <PercentBadge team={team} percent={percent} />
            ) : (
                <span className="size-6 shrink-0 md:size-8" aria-hidden />
            )}
        </div>
    );
}

export const PredictionBracketMatchCard = memo<Props>(function PredictionBracketMatchCard({
    match,
    inferredWinnerSide,
}) {
    const localize = useLocalizedSportsTeamName();
    const locale = useLocale();
    const marketSlug = match.marketSlugs.find((slug): slug is string => !!slug);

    const isFinal = match.status === 'final';
    const isLive = match.status === 'live';
    const hasScores = match.scores !== null;
    // Win-rate badges show only for upcoming matches; scores are null then, so the two slots never compete.
    // Null when not upcoming or unavailable; the `percentages &&` gate below narrows it to the tuple.
    const percentages = match.status === 'upcoming' ? match.percentages : null;
    // Winner side: the higher score wins once finalized. Finalized draws (penalty shootouts) fall
    // back to the temporarily inferred winner until the backend exposes penalty/winner data.
    const decisiveSide =
        isFinal && match.scores && match.scores[0] !== match.scores[1]
            ? match.scores[0] > match.scores[1]
                ? 0
                : 1
            : null;
    const isDraw = isFinal && !!match.scores && match.scores[0] === match.scores[1];
    const winnerSide = decisiveSide ?? (isDraw ? (inferredWinnerSide ?? null) : null);

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

    // Round label is shown only for the Final and 3rd-place play-off, in every match state
    // (upcoming date pill, LIVE, and finished "Advances"). Other rounds render no label.
    const roundLabel: ReactNode =
        match.roundId === 'final' ? <Trans>Final</Trans> : match.roundId === 'third' ? <Trans>3rd Place</Trans> : null;
    const hasRoundLabel = roundLabel !== null;

    // Inner status content; the shared header wrapper below adds the row layout + label.
    let status: ReactNode;
    if (isLive) {
        status = (
            <span className="flex items-center gap-2 text-xs font-medium md:text-[13px]" style={{ color: LIVE_COLOR }}>
                <Trans>LIVE</Trans>
                <span aria-hidden>●</span>
            </span>
        );
    } else if (isFinal) {
        status = (
            <>
                {winnerTeam?.flagUrl ? (
                    <img src={winnerTeam.flagUrl} alt="" className="h-4 w-6 rounded object-cover md:h-5 md:w-[30px]" />
                ) : null}
                <span className="text-xs font-medium text-main md:text-[13px]">
                    <Trans>Advances</Trans>
                </span>
            </>
        );
    } else {
        status = dateLabel ? (
            <span className="flex h-6 items-center whitespace-nowrap rounded-lg bg-bg px-2 text-xs font-semibold text-main md:h-7 md:text-[13px]">
                {dateLabel}
            </span>
        ) : (
            <span className="h-6 md:h-7" />
        );
    }

    const header = (
        <div
            className={classNames('flex h-7 items-center gap-2 md:h-8', {
                // Finished matches center the "Advances" indicator — keep that for every round
                // except Final/3rd, where the trailing label needs left alignment.
                'justify-center': isFinal && !hasRoundLabel,
            })}
        >
            {status}
            {hasRoundLabel ? (
                <span className="text-xs font-medium text-second md:text-[13px]">{roundLabel}</span>
            ) : null}
        </div>
    );

    const content = (
        <div className="flex flex-col gap-2 rounded-xl border border-secondaryLine bg-lightBottom p-2 dark:bg-darkBottom md:gap-3 md:p-3">
            {header}
            <TeamSide
                team={match.teams[0]}
                score={match.scores?.[0] ?? null}
                hasScore={hasScores}
                percent={percentages && match.teams[0] ? percentages[0] : null}
                dimmed={winnerSide === 1}
                localize={localize}
            />
            <TeamSide
                team={match.teams[1]}
                score={match.scores?.[1] ?? null}
                hasScore={hasScores}
                percent={percentages && match.teams[1] ? percentages[1] : null}
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
