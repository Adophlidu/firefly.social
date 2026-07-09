'use client';

import { Locale } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import dayjs from 'dayjs';
import { memo, useMemo } from 'react';

import { Image } from '@/components/Image.js';
import { PenaltyShootoutDots } from '@/components/Prediction/Sport/PenaltyShootoutDots.js';
import { SportScoreWithPenalty } from '@/components/Prediction/Sport/SportScoreWithPenalty.js';
import { SportTennisScoreValue } from '@/components/Prediction/Sport/SportTennisScoreValue.js';
import { getDayjsLocaleName } from '@/helpers/dayjsLocale.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { getPenaltyScore } from '@/helpers/prediction/penaltyShootout.js';
import {
    compareScorePair,
    getLoser,
    getPrimaryMarket,
    getScoreValue,
    getSingleScore,
    getTennisSetKey,
    getTieBreakValue,
    isPenaltyPeriod,
} from '@/helpers/prediction/sportScoreUtils.js';
import { useLocalizedSportsTeamName } from '@/hooks/prediction/useLocalizedSportsTeamName.js';
import { useLocale } from '@/hooks/useLocale.js';
import type {
    BetsEventDataForUI,
    PenaltyKickOutcome,
    PenaltyShootout,
    SportEventData,
    SportTeam,
} from '@/types/prediction.js';
import { SportScoreType } from '@/types/prediction.js';

interface SportTeamDataDisplayProps {
    sportData: SportEventData;
    event: BetsEventDataForUI;
}

function TeamColumn({
    team,
    fallbackLabel,
    muted,
    penaltyOutcomes,
}: {
    team: SportTeam;
    fallbackLabel: string;
    muted?: boolean;
    penaltyOutcomes?: PenaltyKickOutcome[];
}) {
    const resolveTeamName = useLocalizedSportsTeamName();
    const label = (team.name ? resolveTeamName(team.name) : '') || team.abbreviation || fallbackLabel;
    const hasPenaltyDots = !!penaltyOutcomes && penaltyOutcomes.length > 0;

    return (
        <div
            className={classNames(
                'flex h-full min-w-0 flex-1 flex-col items-center justify-center md:w-[156px] md:flex-none md:shrink-0',
                muted ? 'opacity-40' : '',
            )}
        >
            <div className="flex min-h-[81px] w-full max-w-[156px] flex-col items-center justify-center gap-2">
                <div
                    className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                    style={{
                        backgroundColor: team.logo ? undefined : team.color,
                    }}
                >
                    {team.logo ? (
                        <Image
                            src={team.logo}
                            alt={label}
                            width={48}
                            height={48}
                            className="size-full rounded-lg object-contain"
                            fallback="square"
                        />
                    ) : (
                        <span className="text-xl font-bold text-white">{label[0] || '?'}</span>
                    )}
                </div>
                <p className="w-full max-w-[156px] truncate text-center text-[13px] font-semibold leading-4 text-lightMain">
                    {label}
                </p>
                {hasPenaltyDots ? <PenaltyShootoutDots outcomes={penaltyOutcomes} /> : null}
            </div>
        </div>
    );
}

function ProbabilityBar({
    homeTeam,
    awayTeam,
    homePct,
    awayPct,
    drawPct,
}: {
    homeTeam: SportTeam;
    awayTeam: SportTeam;
    homePct: number;
    awayPct: number;
    drawPct?: number;
}) {
    const segments = [
        { key: 'home', pct: homePct, color: homeTeam.color || '#E74C3C' },
        ...(drawPct ? [{ key: 'draw', pct: drawPct, color: '#9CA3AF' }] : []),
        { key: 'away', pct: awayPct, color: awayTeam.color || '#2ECC71' },
    ].filter((segment) => segment.pct > 0);

    return (
        <div className="flex h-1 w-[52px] items-center gap-0.5">
            {segments.map((segment) => (
                <div
                    key={segment.key}
                    className="h-1 min-w-0"
                    style={{
                        flexGrow: segment.pct,
                        flexBasis: 0,
                        backgroundColor: segment.color,
                    }}
                />
            ))}
        </div>
    );
}

function UpcomingCenter({
    homeTeam,
    awayTeam,
    homePct,
    awayPct,
    drawPct,
    formattedTime,
}: {
    homeTeam: SportTeam;
    awayTeam: SportTeam;
    homePct: number;
    awayPct: number;
    drawPct?: number;
    formattedTime: string | null;
}) {
    return (
        <>
            <div className="flex w-32 items-center justify-center gap-1">
                <span className="shrink-0 text-[13px] font-semibold leading-[17px] text-lightMain">{homePct}%</span>
                <ProbabilityBar
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                    homePct={homePct}
                    awayPct={awayPct}
                    drawPct={drawPct}
                />
                <span className="shrink-0 text-[13px] font-semibold leading-[17px] text-lightMain">{awayPct}%</span>
            </div>
            {formattedTime ? (
                <div className="flex h-6 items-center justify-center">
                    <span className="text-xs font-medium leading-[14px] text-lightMain">{formattedTime}</span>
                </div>
            ) : null}
        </>
    );
}

function ScoreRow({
    scores,
    loser,
    multipleSets,
    penaltyShootout,
}: {
    scores: SportEventData['scores'];
    loser?: 'home' | 'away';
    multipleSets?: boolean;
    penaltyShootout?: PenaltyShootout;
}) {
    if (multipleSets && scores.length > 1) {
        return (
            <div className="flex max-w-full items-center justify-center gap-3 text-base font-semibold leading-6">
                {scores.map((set, index) => {
                    if (!set.score?.length) return null;
                    const comparison = compareScorePair(set.score, set.memo);
                    return (
                        <div
                            key={getTennisSetKey(scores, index)}
                            className="flex min-w-0 flex-col items-center justify-center gap-1"
                        >
                            <SportTennisScoreValue
                                value={getScoreValue(set.score, 0)}
                                tieBreakScore={getTieBreakValue(set.memo, 0)}
                                muted={comparison < 0}
                            />
                            <SportTennisScoreValue
                                value={getScoreValue(set.score, 1)}
                                tieBreakScore={getTieBreakValue(set.memo, 1)}
                                muted={comparison > 0}
                            />
                        </div>
                    );
                })}
            </div>
        );
    }

    const [homeScore, awayScore] = getSingleScore(scores);
    const homePenaltyScore = getPenaltyScore(penaltyShootout?.home);
    const awayPenaltyScore = getPenaltyScore(penaltyShootout?.away);
    return (
        <div className="flex w-full items-center justify-center gap-1 text-base font-semibold leading-6 text-lightMain">
            <span className={classNames(loser === 'home' ? 'opacity-40' : '')}>
                <SportScoreWithPenalty score={homeScore} penaltyScore={homePenaltyScore} />
            </span>
            <span>-</span>
            <span className={classNames(loser === 'away' ? 'opacity-40' : '')}>
                <SportScoreWithPenalty score={awayScore} penaltyScore={awayPenaltyScore} />
            </span>
        </div>
    );
}

function LiveStatus({ period, isPenalty }: { period?: string; isPenalty?: boolean }) {
    return (
        <div className="flex h-6 items-center justify-center gap-1.5">
            <span className="text-xs font-medium leading-[14px] text-danger">
                <Trans>LIVE</Trans>
            </span>
            {isPenalty ? (
                <>
                    <span className="size-1.5 rounded-full bg-danger" />
                    <span className="text-xs font-medium leading-[14px] text-danger">
                        <Trans>PENALTY</Trans>
                    </span>
                </>
            ) : period ? (
                <>
                    <span className="size-1.5 rounded-full bg-danger" />
                    <span className="text-xs font-medium leading-[14px] text-lightMain">{period}</span>
                </>
            ) : null}
        </div>
    );
}

function FinalStatus() {
    return (
        <div className="flex h-6 items-center justify-center">
            <span className="rounded bg-[#f0f0f0] px-1.5 py-0.5 text-xs font-bold text-second dark:bg-[#3a3a3a]">
                <Trans>FINAL</Trans>
            </span>
        </div>
    );
}

export const SportTeamDataDisplay = memo(function SportTeamDataDisplay({
    sportData,
    event,
}: SportTeamDataDisplayProps) {
    const locale = useLocale();

    const {
        homeTeam,
        awayTeam,
        scores,
        live,
        ended,
        period,
        penaltyShootout,
        winResult,
        isDraw,
        startTime,
        leagueName,
        scoreType,
    } = sportData;
    const multipleSets = scoreType === SportScoreType.Multiple;
    const isPenalty = live && (isPenaltyPeriod(period) || !!penaltyShootout);
    const primaryMarket = getPrimaryMarket(event.markets);
    const homePrice = Number.parseFloat(primaryMarket?.outcomes[0]?.price || '0');
    const awayPrice = Number.parseFloat(primaryMarket?.outcomes[1]?.price || '0');
    const drawPrice =
        isDraw && primaryMarket?.outcomes[2] ? Number.parseFloat(primaryMarket.outcomes[2].price || '0') : undefined;

    const eventVolume = typeof event.volume === 'string' ? Number(event.volume) : event.volume;
    const total = homePrice + awayPrice + (drawPrice ? drawPrice : 0);
    const homePct = total > 0 ? Math.round((homePrice / total) * 100) : 50;
    const awayPct = total > 0 ? Math.round((awayPrice / total) * 100) : 50;
    const drawPct = drawPrice && total > 0 ? Math.round((drawPrice / total) * 100) : undefined;
    const loser = ended ? getLoser(winResult, scores, penaltyShootout) : undefined;
    const formattedMeta = [eventVolume > 0 ? `$${nFormatter(eventVolume, 2, true)}` : null, leagueName]
        .filter(Boolean)
        .join(' · ');
    const formattedTime = useMemo(() => {
        const dayjsLocale = getDayjsLocaleName(
            Object.values(Locale).includes(locale as Locale) ? (locale as Locale) : Locale.en,
        );
        // Format with an explicit per-instance dayjs locale (from useLingui, request-correct on
        // both server and client) instead of the process-shared global dayjs locale, which races
        // between concurrent SSR requests and causes server/client hydration mismatches.
        return startTime ? dayjs(new Date(startTime).getTime()).locale(dayjsLocale).format('MMM D h:mm A') : null;
    }, [locale, startTime]);

    return (
        <div className="px-4">
            <div className="mx-auto flex h-[125px] w-full max-w-[500px] items-center justify-center">
                <TeamColumn
                    team={homeTeam}
                    fallbackLabel="Home"
                    muted={loser === 'home'}
                    penaltyOutcomes={penaltyShootout?.home}
                />

                <div className="flex h-full min-w-0 flex-1 flex-col items-center justify-center">
                    <div className="flex w-full flex-col items-center gap-2">
                        {!live && !ended ? (
                            <UpcomingCenter
                                homeTeam={homeTeam}
                                awayTeam={awayTeam}
                                homePct={homePct}
                                awayPct={awayPct}
                                drawPct={drawPct}
                                formattedTime={formattedTime}
                            />
                        ) : null}

                        {live ? (
                            <>
                                <ScoreRow
                                    scores={scores}
                                    multipleSets={multipleSets}
                                    penaltyShootout={penaltyShootout}
                                />
                                <LiveStatus period={period} isPenalty={isPenalty} />
                            </>
                        ) : null}

                        {ended ? (
                            <>
                                <ScoreRow
                                    scores={scores}
                                    loser={loser}
                                    multipleSets={multipleSets}
                                    penaltyShootout={penaltyShootout}
                                />
                                <FinalStatus />
                            </>
                        ) : null}

                        {formattedMeta ? (
                            <span className="max-w-full truncate text-[13px] font-normal leading-[17px] text-second">
                                {formattedMeta}
                            </span>
                        ) : null}
                    </div>
                </div>

                <TeamColumn
                    team={awayTeam}
                    fallbackLabel="Away"
                    muted={loser === 'away'}
                    penaltyOutcomes={penaltyShootout?.away}
                />
            </div>
        </div>
    );
});
