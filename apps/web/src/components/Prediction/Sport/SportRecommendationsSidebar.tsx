'use client';

import { PredictionPlatform } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';
import dayjs from 'dayjs';
import { memo, useMemo } from 'react';

import { Image } from '@/esm/Image.js';
import { Link } from '@/esm/Link.js';
import {
    formatPolymarketSportsEventForUI,
    type PredictionSportsCellViewModel,
    type PredictionSportsTeamForUI,
} from '@/helpers/prediction/category/formatPolymarketSportsEventForUI.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import type { PolymarketSportsEvent, PolymarketSportsMarketData } from '@/providers/types/Firefly.js';

interface SportRecommendationsSidebarProps {
    categorySlug: string;
    categoryTagType?: string;
    events: PolymarketSportsEvent[];
}

interface SportRecommendationItem {
    event: PolymarketSportsEvent;
    model: PredictionSportsCellViewModel;
}

interface ScheduledTimeParts {
    date: string;
    time: string;
}

function getTeamAbbreviation(team: PredictionSportsTeamForUI): string {
    const name = team.name?.trim();
    if (name) return name;

    const abbreviation = team.abbreviation?.trim();
    if (abbreviation) return abbreviation.toUpperCase();

    return '--';
}

function getScheduledTimeParts(event: PolymarketSportsEvent): ScheduledTimeParts | undefined {
    const moneyline = event.markets?.find((market) => {
        const sportMarket = market as PolymarketSportsMarketData;
        return sportMarket.sportsMarketType === 'moneyline';
    }) as PolymarketSportsMarketData | undefined;
    const startTime = moneyline?.gameStartTime || event.startDate;
    if (!startTime) return undefined;

    const date = dayjs(startTime);
    return date.isValid() ? { date: date.format('MMM D'), time: date.format('h:mm A') } : undefined;
}

function getLiveScoreLabel(model: PredictionSportsCellViewModel): string {
    const homeScore = model.homeTeam.score;
    const awayScore = model.awayTeam.score;

    if (typeof homeScore === 'number' && typeof awayScore === 'number') {
        return `${homeScore} - ${awayScore}`;
    }

    return 'LIVE';
}

function getFinishedScoreLabel(model: PredictionSportsCellViewModel): string {
    const homeScore = model.homeTeam.score;
    const awayScore = model.awayTeam.score;

    if (typeof homeScore === 'number' && typeof awayScore === 'number') {
        return `${homeScore} - ${awayScore}`;
    }

    return '';
}

function TeamColumn({ team }: { team: PredictionSportsTeamForUI }) {
    const label = getTeamAbbreviation(team);

    return (
        <div className="flex w-12 shrink-0 flex-col items-center gap-2">
            {team.logo ? (
                <Image src={team.logo} alt="" width={48} height={48} className="size-12 rounded-lg object-cover" />
            ) : (
                <span className="flex size-12 items-center justify-center rounded-lg bg-bg text-sm font-semibold text-second">
                    {label[0]}
                </span>
            )}
            <span className="w-full truncate text-center text-xs font-semibold leading-4 text-main">{label}</span>
        </div>
    );
}

const RecommendationCard = memo<{ item: SportRecommendationItem }>(function RecommendationCard({ item }) {
    const { event, model } = item;
    const eventHref = RouteResolver.betsEventDetail(PredictionPlatform.Polymarket, model.eventSlug, {
        appendRoot: false,
    });
    const scheduledTimeParts = getScheduledTimeParts(event);

    return (
        <Link
            href={eventHref}
            className="flex min-h-[104px] items-center gap-3 rounded-lg border border-line bg-primaryBottom p-4 transition-colors hover:bg-bg"
        >
            <TeamColumn team={model.homeTeam} />
            <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-2 text-center">
                {model.gamePhase === 'live' ? (
                    <>
                        <span className="text-xl font-bold leading-6 text-main">{getLiveScoreLabel(model)}</span>
                        <span className="flex min-w-0 items-center justify-center gap-2 text-xs leading-4">
                            <span className="shrink-0 font-semibold text-danger">
                                <Trans>LIVE</Trans>
                            </span>
                            {model.statusLabel ? (
                                <>
                                    <span className="size-1.5 shrink-0 rounded-full bg-danger" />
                                    <span className="min-w-0 truncate text-second">{model.statusLabel}</span>
                                </>
                            ) : null}
                        </span>
                    </>
                ) : model.gamePhase === 'finished' ? (
                    <>
                        <span className="text-xl font-bold leading-6 text-main">{getFinishedScoreLabel(model)}</span>
                        <span className="rounded bg-[#f0f0f0] px-1.5 py-0.5 text-xs font-bold text-second dark:bg-[#3a3a3a]">
                            <Trans>FINAL</Trans>
                        </span>
                    </>
                ) : (
                    <span className="flex flex-col text-sm font-semibold leading-5 text-main">
                        {scheduledTimeParts ? (
                            <>
                                <span>{scheduledTimeParts.date}</span>
                                <span>{scheduledTimeParts.time}</span>
                            </>
                        ) : (
                            <span>{model.scheduledTimeLabel || '--'}</span>
                        )}
                    </span>
                )}
            </div>
            <TeamColumn team={model.awayTeam} />
        </Link>
    );
});

export const SportRecommendationsSidebar = memo(function SportRecommendationsSidebar({
    categorySlug,
    categoryTagType,
    events,
}: SportRecommendationsSidebarProps) {
    const items = useMemo(
        () =>
            events.flatMap((event) => {
                const model = formatPolymarketSportsEventForUI(event);
                return model ? [{ event, model }] : [];
            }),
        [events],
    );

    if (!items.length) return null;

    const categoryHref = RouteResolver.predictionCategory({
        slug: categorySlug,
        tagType: categoryTagType,
        appendRoot: false,
    });

    return (
        <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-3">
                <h2 className="text-xl font-bold leading-6 text-lightMain">
                    <Trans>You might like</Trans>
                </h2>
                <Link href={categoryHref} className="text-sm font-medium leading-6 text-highlight hover:underline">
                    <Trans>More</Trans>
                </Link>
            </div>
            <div className="flex flex-col gap-4">
                {items.slice(0, 5).map((item) => (
                    <RecommendationCard key={item.model.eventId} item={item} />
                ))}
            </div>
        </section>
    );
});
