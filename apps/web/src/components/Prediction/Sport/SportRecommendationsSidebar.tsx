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
    events: PolymarketSportsEvent[];
    leagueSlug: string;
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
    const abbreviation = team.abbreviation?.trim();
    if (abbreviation) return abbreviation.toUpperCase();

    const name = team.name.trim();
    if (!name) return '--';

    const words = name.split(/\s+/u).filter(Boolean);
    if (words.length > 1)
        return words
            .map((word) => word[0])
            .join('')
            .slice(0, 3)
            .toUpperCase();

    return name.slice(0, 3).toUpperCase();
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

function TeamColumn({ team }: { team: PredictionSportsTeamForUI }) {
    const label = getTeamAbbreviation(team);

    return (
        <div className="flex w-12 shrink-0 flex-col items-center gap-2">
            {team.logo ? (
                <Image src={team.logo} alt="" width={48} height={48} className="size-12 rounded-lg object-cover" />
            ) : (
                <span className="bg-bg text-second flex size-12 items-center justify-center rounded-lg text-sm font-semibold">
                    {label[0]}
                </span>
            )}
            <span className="text-main w-full truncate text-center text-xs font-semibold leading-4">{label}</span>
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
            className="border-line bg-primaryBottom hover:bg-bg flex min-h-[104px] items-center gap-3 rounded-lg border p-4 transition-colors"
        >
            <TeamColumn team={model.homeTeam} />
            <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-2 text-center">
                {model.gamePhase === 'live' ? (
                    <>
                        <span className="text-main text-xl font-bold leading-6">{getLiveScoreLabel(model)}</span>
                        <span className="flex min-w-0 items-center justify-center gap-2 text-xs leading-4">
                            <span className="text-danger shrink-0 font-semibold">
                                <Trans>LIVE</Trans>
                            </span>
                            {model.statusLabel ? (
                                <>
                                    <span className="bg-danger size-1.5 shrink-0 rounded-full" />
                                    <span className="text-second min-w-0 truncate">{model.statusLabel}</span>
                                </>
                            ) : null}
                        </span>
                    </>
                ) : (
                    <span className="text-main flex flex-col text-sm font-semibold leading-5">
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
    events,
    leagueSlug,
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

    const categoryHref = RouteResolver.predictionCategory({ slug: leagueSlug, tagType: 'league', appendRoot: false });

    return (
        <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-3">
                <h2 className="text-lightMain text-xl font-bold leading-6">
                    <Trans>You might like</Trans>
                </h2>
                <Link href={categoryHref} className="text-highlight text-sm font-medium leading-6 hover:underline">
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
