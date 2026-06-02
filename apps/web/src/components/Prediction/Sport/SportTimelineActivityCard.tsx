'use client';

import { PredictionPlatform } from '@dimensiondev/enums';
import { classNames, parseJson } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import dayjs from 'dayjs';
import { memo, type ReactNode } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { SportTennisScoreValue } from '@/components/Prediction/Sport/SportTennisScoreValue.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { openPredictionPage } from '@/helpers/openPredictionPage.js';
import { formatPriceCents } from '@/helpers/prediction/category/formatPolymarketSportsEventForUI.js';
import {
    compareScorePair,
    getScoreValue,
    getTennisSetKey,
    getTieBreakValue,
    matchesTeamLabel,
} from '@/helpers/prediction/sportScoreUtils.js';
import type { BetsActivity, SportActivityScore, SportActivityTeam } from '@/providers/types/Firefly.js';

const HOME_FALLBACK_COLOR = '#3DC233';
const AWAY_FALLBACK_COLOR = '#FF3545';
const DRAW_BACKGROUND = 'rgb(var(--color-bg03, 232 232 232))';

interface SportTimelineActivityCardProps {
    activity: BetsActivity;
}

interface TeamViewModel {
    name: string;
    abbreviation?: string;
    logo?: string;
    color: string;
    record?: string;
}

interface OutcomeViewModel {
    label: string;
    price?: string;
    outcomeIndex?: number;
    color: string;
    draw?: boolean;
}

function normalizeStringArray(items: string[]) {
    const normalizedItems: string[] = [];

    for (const item of items) {
        const normalizedItem = `${item}`.trim();
        if (normalizedItem) normalizedItems.push(normalizedItem);
    }

    return normalizedItems;
}

function parseStringArray(value: string | string[] | undefined | null): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return normalizeStringArray(value);
    const parsedValue = parseJson<string[]>(value);
    return parsedValue ? normalizeStringArray(parsedValue) : [];
}

function getOutcomeLabels(activity: BetsActivity) {
    const directLabels = activity.conditionOutcomes ?? [];
    const rawLabels = parseStringArray(activity.rawData?.outcomes);
    return rawLabels.length > directLabels.length ? rawLabels : directLabels;
}

function getOutcomePrices(activity: BetsActivity) {
    const directPrices = activity.conditionOutcomePrices ?? [];
    const rawPrices = parseStringArray(activity.rawData?.outcomePrices);
    return rawPrices.length > directPrices.length ? rawPrices : directPrices;
}

function isDrawLabel(label: string | undefined) {
    return label?.trim().toLowerCase() === 'draw';
}

function resolveDrawIndex(labels: string[]) {
    const foundIndex = labels.findIndex(isDrawLabel);
    if (foundIndex >= 0) return foundIndex;
    return labels.length > 2 ? 1 : undefined;
}

function resolveAwayIndex(labels: string[], drawIndex?: number) {
    if (labels.length < 3) return 1;
    return [1, 2].find((index) => index !== drawIndex) ?? 2;
}

function resolveFallbackOutcomeIndex(labels: string[], excluded: Set<number>, preferredIndex: number) {
    if (!excluded.has(preferredIndex)) return preferredIndex;
    const fallbackIndex = labels.findIndex((_, index) => !excluded.has(index));
    return fallbackIndex >= 0 ? fallbackIndex : preferredIndex;
}

function resolveTeamOutcomeIndex(labels: string[], team: TeamViewModel, excluded: Set<number>, preferredIndex: number) {
    const matchedIndex = labels.findIndex((label, index) => !excluded.has(index) && matchesTeamLabel(team, label));
    if (matchedIndex >= 0) return { index: matchedIndex, matched: true };

    return {
        index: resolveFallbackOutcomeIndex(labels, excluded, preferredIndex),
        matched: false,
    };
}

function normalizeTeam(
    team: SportActivityTeam | undefined,
    fallbackLabel: string,
    fallbackColor: string,
): TeamViewModel {
    const name = team?.name?.trim() || team?.abbreviation?.trim() || fallbackLabel;

    return {
        name,
        abbreviation: team?.abbreviation?.trim() || undefined,
        logo: team?.logo,
        color: team?.color || fallbackColor,
        record: team?.record,
    };
}

function resolveTeams(activity: BetsActivity, labels: string[]) {
    const sport = activity.sportData;
    const sportTeams =
        sport?.isDraw && sport.drawTeams?.length === 2
            ? sport.drawTeams
            : sport?.marketTeams?.length === 2
              ? sport.marketTeams
              : sport?.drawTeams?.length === 2
                ? sport.drawTeams
                : [];

    const drawIndex = resolveDrawIndex(labels);
    const awayIndex = resolveAwayIndex(labels, drawIndex);
    const excludedIndexes = new Set<number>();
    if (drawIndex !== undefined) excludedIndexes.add(drawIndex);

    const homeTeam = normalizeTeam(sportTeams[0], labels[0] || 'Home', HOME_FALLBACK_COLOR);
    const awayTeam = normalizeTeam(sportTeams[1], labels[awayIndex] || labels[1] || 'Away', AWAY_FALLBACK_COLOR);
    const homeOutcome = resolveTeamOutcomeIndex(labels, homeTeam, excludedIndexes, 0);
    excludedIndexes.add(homeOutcome.index);
    const awayOutcome = resolveTeamOutcomeIndex(labels, awayTeam, excludedIndexes, awayIndex);

    return {
        homeTeam,
        awayTeam,
        drawIndex,
        homeOutcome,
        awayOutcome,
    };
}

function getButtonLabel(team: TeamViewModel, fallback: string) {
    return team.name || team.abbreviation || fallback;
}

function getOutcomeButtonLabel(team: TeamViewModel, fallbackLabel: string | undefined, matchedTeam: boolean) {
    if (matchedTeam) return getButtonLabel(team, fallbackLabel || team.name);
    return fallbackLabel || getButtonLabel(team, 'Outcome');
}

function getOutcomeKey(outcome: OutcomeViewModel) {
    if (outcome.outcomeIndex !== undefined) return `${outcome.outcomeIndex}-${outcome.label}`;
    return `${outcome.label}-${outcome.price || ''}-${outcome.color}`;
}

function formatPercent(value: number) {
    if (!Number.isFinite(value) || value <= 0) return '0%';
    if (value < 1) return '<1%';
    return `${Math.round(value)}%`;
}

function getNumericPrice(price: string | undefined) {
    const value = Number.parseFloat(price || '');
    return Number.isFinite(value) ? value : 0;
}

function getLatestScores(scores: SportActivityScore[]) {
    return scores.at(-1)?.score;
}

function resolveWinner(activity: BetsActivity): 'home' | 'away' | 'draw' | undefined {
    const sport = activity.sportData;
    if (!sport?.ended) return undefined;

    if (sport.winResult === 0) return 'home';
    if (sport.winResult === 2) return 'away';
    if (sport.winResult === 1 && sport.isDraw) return 'draw';

    const latestScores = getLatestScores(sport.scoreShow ?? []);
    const scoreComparison = compareScorePair(latestScores);
    if (scoreComparison > 0) return 'home';
    if (scoreComparison < 0) return 'away';
    return sport.isDraw ? 'draw' : undefined;
}

function formatScore(value: number | undefined) {
    return value === undefined ? '-' : value;
}

function formatVolumeLabel(volume: string | number | undefined) {
    const numericVolume = typeof volume === 'string' ? Number.parseFloat(volume) : volume;
    if (!numericVolume || !Number.isFinite(numericVolume) || numericVolume <= 0) return undefined;
    return `$${nFormatter(numericVolume, 2)}`;
}

function formatStartTime(activity: BetsActivity) {
    const startTime = activity.sportData?.startTime || activity.rawData?.startDateIso || activity.rawData?.startDate;
    if (!startTime) return undefined;

    const timestamp = new Date(startTime).getTime();
    if (!Number.isFinite(timestamp)) return undefined;
    return dayjs(timestamp).format('MMM D h:mm A');
}

function TeamLogo({ team }: { team: TeamViewModel }) {
    return (
        <div
            className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg"
            style={{ backgroundColor: team.logo ? undefined : `${team.color}18` }}
        >
            {team.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={team.logo}
                    alt={team.name || team.abbreviation}
                    className="size-full rounded-lg object-contain"
                />
            ) : (
                <span className="text-sm font-bold leading-5" style={{ color: team.color }}>
                    {(team.name || team.abbreviation || '?').slice(0, 3)}
                </span>
            )}
        </div>
    );
}

function TeamColumn({ team, isLoser }: { team: TeamViewModel; isLoser?: boolean }) {
    return (
        <div
            className={classNames('flex h-full min-w-0 flex-col items-center justify-center gap-2 text-center', {
                'opacity-40': !!isLoser,
            })}
        >
            <TeamLogo team={team} />
            <p className="line-clamp-2 min-h-4 w-full break-words text-[10px] font-semibold leading-4 text-lightMain md:text-[13px]">
                {team.name}
            </p>
        </div>
    );
}

function ProbabilityBar({ outcomes }: { outcomes: OutcomeViewModel[] }) {
    const total = outcomes.reduce((sum, outcome) => sum + getNumericPrice(outcome.price), 0);
    if (total <= 0) return null;

    const [homeOutcome, , awayOutcome] = outcomes.length === 3 ? outcomes : [outcomes[0], undefined, outcomes[1]];
    const homePercent = (getNumericPrice(homeOutcome?.price) / total) * 100;
    const awayPercent = (getNumericPrice(awayOutcome?.price) / total) * 100;

    return (
        <div className="flex h-6 max-w-full items-center justify-center gap-1">
            <span className="shrink-0 text-[13px] font-semibold leading-[17px] text-lightMain">
                {formatPercent(homePercent)}
            </span>
            <div className="flex h-1 w-[52px] shrink-0 gap-0.5 overflow-hidden">
                {outcomes.map((outcome) => {
                    const width = (getNumericPrice(outcome.price) / total) * 100;
                    return (
                        <div
                            key={getOutcomeKey(outcome)}
                            className="h-full min-w-1"
                            style={{
                                width: `${width}%`,
                                backgroundColor: outcome.draw ? DRAW_BACKGROUND : outcome.color,
                            }}
                        />
                    );
                })}
            </div>
            <span className="shrink-0 text-[13px] font-semibold leading-[17px] text-lightMain">
                {formatPercent(awayPercent)}
            </span>
        </div>
    );
}

function ScoreLine({ activity, winner }: { activity: BetsActivity; winner?: 'home' | 'away' | 'draw' }) {
    const latestScores = getLatestScores(activity.sportData?.scoreShow ?? []);
    const homeScore = getScoreValue(latestScores, 0);
    const awayScore = getScoreValue(latestScores, 1);

    return (
        <div className="flex h-6 items-center justify-center gap-1 text-base font-semibold leading-6 text-lightMain">
            <span className={classNames({ 'opacity-40': winner === 'away' })}>{formatScore(homeScore)}</span>
            <span>-</span>
            <span className={classNames({ 'opacity-40': winner === 'home' })}>{formatScore(awayScore)}</span>
        </div>
    );
}

function TennisScore({ scores }: { scores: SportActivityScore[] }) {
    return (
        <div className="flex max-w-full items-center justify-center gap-3 text-base font-semibold leading-6">
            {scores.map((score, index) => {
                const comparison = compareScorePair(score.score, score.memo);
                return (
                    <div
                        key={getTennisSetKey(scores, index)}
                        className="flex min-w-0 flex-col items-center justify-center gap-1"
                    >
                        <SportTennisScoreValue
                            value={getScoreValue(score.score, 0)}
                            tieBreakScore={getTieBreakValue(score.memo, 0)}
                            muted={comparison < 0}
                        />
                        <SportTennisScoreValue
                            value={getScoreValue(score.score, 1)}
                            tieBreakScore={getTieBreakValue(score.memo, 1)}
                            muted={comparison > 0}
                        />
                    </div>
                );
            })}
        </div>
    );
}

function StatusLine({ activity }: { activity: BetsActivity }) {
    const sport = activity.sportData;
    if (!sport) return null;

    if (sport.live) {
        return (
            <div className="flex h-6 items-center justify-center gap-1.5 text-xs font-medium leading-[14px]">
                <span className="text-danger">
                    <Trans>LIVE</Trans>
                </span>
                {sport.periodShow ? (
                    <>
                        <span className="size-1.5 rounded-full bg-danger" />
                        <span className="whitespace-nowrap text-lightMain">{sport.periodShow}</span>
                    </>
                ) : null}
            </div>
        );
    }

    if (sport.ended) {
        return (
            <div className="flex h-6 items-center justify-center text-xs font-medium leading-[14px] text-lightMain">
                <Trans>FINAL</Trans>
            </div>
        );
    }

    const startTime = formatStartTime(activity);
    return startTime ? (
        <div className="flex h-6 items-center justify-center whitespace-nowrap text-[10px] font-medium leading-[14px] text-lightMain md:text-xs">
            {startTime}
        </div>
    ) : null;
}

function MetaLine({ activity }: { activity: BetsActivity }) {
    const volumeLabel = formatVolumeLabel(activity.volume);
    const metaItems = [volumeLabel, activity.sportData?.leagueName].filter(Boolean);
    if (!metaItems.length) return null;

    return <p className="truncate text-[13px] leading-[17px] text-second">{metaItems.join(' · ')}</p>;
}

function CenterColumn({
    activity,
    outcomes,
    winner,
}: {
    activity: BetsActivity;
    outcomes: OutcomeViewModel[];
    winner?: 'home' | 'away' | 'draw';
}) {
    const sport = activity.sportData;
    const scores = sport?.scoreShow ?? [];
    const showTennisScore = (sport?.scoreType === 2 || scores.length > 1) && scores.length > 1;

    let topContent: ReactNode = null;
    if (showTennisScore) {
        topContent = <TennisScore scores={scores} />;
    } else if (sport?.live || sport?.ended) {
        topContent = <ScoreLine activity={activity} winner={winner} />;
    } else {
        topContent = <ProbabilityBar outcomes={outcomes} />;
    }

    return (
        <div className="flex h-full min-w-0 flex-col items-center justify-center gap-1 text-center md:gap-2">
            {topContent}
            <StatusLine activity={activity} />
            <MetaLine activity={activity} />
        </div>
    );
}

function SportTimelineOutcomeButton({ slug, outcome }: { slug?: string; outcome: OutcomeViewModel }) {
    const canOpen = !!slug && outcome.outcomeIndex !== undefined;
    const [{ loading }, handleOpenPredictionPage] = useAsyncFn(async () => {
        if (!slug || outcome.outcomeIndex === undefined) return;
        await openPredictionPage(slug, { outcome: outcome.outcomeIndex });
    }, [slug, outcome.outcomeIndex]);

    return (
        <ClickableButton
            className="flex h-9 w-full items-center justify-center gap-1 overflow-hidden rounded-lg px-2 text-xs leading-6 disabled:opacity-60 md:text-sm"
            style={
                outcome.draw
                    ? { backgroundColor: DRAW_BACKGROUND, color: 'var(--color-light-main, #181818)' }
                    : { backgroundColor: outcome.color, color: '#fff' }
            }
            data-prevent-progress
            disabled={!canOpen}
            loading={loading}
            type="button"
            onClick={() => {
                if (!canOpen || loading) return;
                handleOpenPredictionPage();
            }}
        >
            <span className="min-w-0 truncate font-medium uppercase opacity-80">{outcome.label}</span>
            <span className="shrink-0 font-bold">{formatPriceCents(outcome.price)}</span>
        </ClickableButton>
    );
}

export const SportTimelineActivityCard = memo<SportTimelineActivityCardProps>(function SportTimelineActivityCard({
    activity,
}) {
    const sport = activity.sportData;
    if (!sport) return null;

    const labels = getOutcomeLabels(activity);
    const prices = getOutcomePrices(activity);
    const {
        homeTeam,
        awayTeam,
        drawIndex,
        homeOutcome: homeOutcomeMeta,
        awayOutcome: awayOutcomeMeta,
    } = resolveTeams(activity, labels);
    const slug = activity.rawData?.slug || activity.slug;
    const winner = resolveWinner(activity);
    const isFinal = !!sport.ended || !!sport.closed;
    const canShowButtons = !isFinal && activity.platform === PredictionPlatform.Polymarket;

    const homeOutcome: OutcomeViewModel = {
        label: getOutcomeButtonLabel(homeTeam, labels[homeOutcomeMeta.index], homeOutcomeMeta.matched),
        price: prices[homeOutcomeMeta.index],
        outcomeIndex: homeOutcomeMeta.index,
        color: homeTeam.color,
    };
    const awayOutcome: OutcomeViewModel = {
        label: getOutcomeButtonLabel(awayTeam, labels[awayOutcomeMeta.index], awayOutcomeMeta.matched),
        price: prices[awayOutcomeMeta.index],
        outcomeIndex: awayOutcomeMeta.index,
        color: awayTeam.color,
    };
    const drawOutcome =
        sport.isDraw && drawIndex !== undefined
            ? {
                  label: t`DRAW`,
                  price: prices[drawIndex],
                  outcomeIndex: drawIndex,
                  color: DRAW_BACKGROUND,
                  draw: true,
              }
            : undefined;
    const outcomes = drawOutcome ? [homeOutcome, drawOutcome, awayOutcome] : [homeOutcome, awayOutcome];

    return (
        <div className="mt-1.5 rounded-2xl border border-line p-3 md:p-4">
            <div className="grid w-full grid-cols-[minmax(84px,156px)_minmax(88px,1fr)_minmax(84px,156px)] items-center gap-2">
                <TeamColumn team={homeTeam} isLoser={winner === 'away'} />
                <CenterColumn activity={activity} outcomes={outcomes} winner={winner} />
                <TeamColumn team={awayTeam} isLoser={winner === 'home'} />
            </div>
            {canShowButtons ? (
                <div className={classNames('mt-2 grid gap-2', drawOutcome ? 'grid-cols-3' : 'grid-cols-2')}>
                    <SportTimelineOutcomeButton slug={slug} outcome={homeOutcome} />
                    {drawOutcome ? <SportTimelineOutcomeButton slug={slug} outcome={drawOutcome} /> : null}
                    <SportTimelineOutcomeButton slug={slug} outcome={awayOutcome} />
                </div>
            ) : null}
        </div>
    );
});
