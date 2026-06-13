'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import dayjs from 'dayjs';
import { memo } from 'react';

import { Image } from '@/components/Image.js';
import { SportTennisScoreValue } from '@/components/Prediction/Sport/SportTennisScoreValue.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import {
    compareScorePair,
    getPrimaryMarket,
    getScoreValue,
    getTennisSetKey,
    getTieBreakValue,
} from '@/helpers/prediction/sportScoreUtils.js';
import { useLocalizedSportsTeamName } from '@/hooks/prediction/useLocalizedSportsTeamName.js';
import type { BetsEventDataForUI, SportEventData, SportTeam } from '@/types/prediction.js';
import { SportScoreType } from '@/types/prediction.js';

interface SportTeamDataDisplayProps {
    sportData: SportEventData;
    event: BetsEventDataForUI;
}

function TeamColumn({ team, fallbackLabel, muted }: { team: SportTeam; fallbackLabel: string; muted?: boolean }) {
    const resolveTeamName = useLocalizedSportsTeamName();
    const label = (team.name ? resolveTeamName(team.name) : '') || team.abbreviation || fallbackLabel;

    return (
        <div
            className={classNames(
                'flex h-full min-w-0 flex-1 flex-col items-center justify-center md:w-[156px] md:flex-none md:shrink-0',
                muted ? 'opacity-40' : '',
            )}
        >
            <div className="flex h-[81px] w-full max-w-[156px] flex-col items-center justify-center gap-2">
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
            </div>
        </div>
    );
}

function getSingleScore(scores: SportEventData['scores']): [number, number] {
    const score = scores[0]?.score;
    return [score?.[0] ?? 0, score?.[1] ?? 0];
}

function getLoser(winResult: number | undefined, scores: SportEventData['scores']) {
    if (winResult === 0) return 'away';
    if (winResult === 2) return 'home';
    if (winResult === 1) return undefined;

    const [homeScore, awayScore] = getSingleScore(scores);
    if (homeScore > awayScore) return 'away';
    if (awayScore > homeScore) return 'home';
    return undefined;
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
}: {
    scores: SportEventData['scores'];
    loser?: 'home' | 'away';
    multipleSets?: boolean;
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
    return (
        <div className="flex w-full items-center justify-center gap-1 text-base font-semibold leading-6 text-lightMain">
            <span className={classNames(loser === 'home' ? 'opacity-40' : '')}>{homeScore}</span>
            <span>-</span>
            <span className={classNames(loser === 'away' ? 'opacity-40' : '')}>{awayScore}</span>
        </div>
    );
}

function LiveStatus({ period }: { period?: string }) {
    return (
        <div className="flex h-6 items-center justify-center gap-1.5">
            <span className="text-xs font-medium leading-[14px] text-danger">
                <Trans>LIVE</Trans>
            </span>
            {period ? (
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
    const { homeTeam, awayTeam, scores, live, ended, period, winResult, isDraw, startTime, leagueName, scoreType } =
        sportData;
    const multipleSets = scoreType === SportScoreType.Multiple;
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
    const loser = ended ? getLoser(winResult, scores) : undefined;
    const formattedMeta = [eventVolume > 0 ? `$${nFormatter(eventVolume, 2, true)}` : null, leagueName]
        .filter(Boolean)
        .join(' · ');

    const formattedTime = startTime ? dayjs(new Date(startTime).getTime()).format('MMM D h:mm A') : null;

    return (
        <div className="px-4">
            <div className="mx-auto flex h-[125px] w-full max-w-[500px] items-center justify-center">
                <TeamColumn team={homeTeam} fallbackLabel="Home" muted={loser === 'home'} />

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
                                <ScoreRow scores={scores} multipleSets={multipleSets} />
                                <LiveStatus period={period} />
                            </>
                        ) : null}

                        {ended ? (
                            <>
                                <ScoreRow scores={scores} loser={loser} multipleSets={multipleSets} />
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

                <TeamColumn team={awayTeam} fallbackLabel="Away" muted={loser === 'away'} />
            </div>
        </div>
    );
});
