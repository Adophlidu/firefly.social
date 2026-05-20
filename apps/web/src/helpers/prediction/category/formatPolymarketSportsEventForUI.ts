import { parseJson, removeTrailingZeros } from '@dimensiondev/utils';
import dayjs from 'dayjs';

import { nFormatter } from '@/helpers/formatCommentCounts.js';
import type {
    PolymarketSportsEvent,
    PolymarketSportsLivestreamInfo,
    PolymarketSportsMarketData,
    PolymarketSportsMarketTeam,
} from '@/providers/types/Firefly.js';

export type PredictionSportsGamePhase = 'live' | 'scheduled' | 'finished';
export type PredictionSportsLayout = 'binary' | 'threeWay';

export interface PredictionSportsDrawOutcomeForUI {
    /** CLOB asset id for the YES outcome (Polymarket websocket). */
    assetId?: string;
    /** Market slug for wallet buy flow (three-way: draw moneyline market). */
    marketSlug?: string;
    /** Outcome index on the market passed to openPredictionPage. */
    outcomeIndex?: number;
    priceCents: string;
    isWinner?: boolean;
    isLoser?: boolean;
}

export interface PredictionSportsTeamForUI {
    name: string;
    logo?: string;
    abbreviation?: string;
    record?: string;
    /** CLOB asset id for this outcome (Polymarket websocket). */
    assetId?: string;
    /** Market slug for wallet buy flow. */
    marketSlug?: string;
    /** Outcome index on the market passed to openPredictionPage. */
    outcomeIndex?: number;
    priceCents: string;
    score?: number;
    color?: string;
    isWinner?: boolean;
    isLoser?: boolean;
}

export interface PredictionSportsCellViewModel {
    eventSlug: string;
    eventId: string;
    layout: PredictionSportsLayout;
    homeTeam: PredictionSportsTeamForUI;
    awayTeam: PredictionSportsTeamForUI;
    drawOutcome?: PredictionSportsDrawOutcomeForUI;
    gamePhase: PredictionSportsGamePhase;
    /** Live: period clock (e.g. Q4 - 3:20). */
    statusLabel?: string;
    /** Scheduled: start time shown in the gray pill (e.g. 10:00 PM). */
    scheduledTimeLabel?: string;
    volumeLabel?: string;
    leagueLabel?: string;
    livestreamUrl?: string;
}

/** Polymarket gamma may return JSON-encoded arrays or real arrays after parsing. */
export function parsePolymarketStringArray(value: string | string[] | undefined | null): string[] {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }
    return parseJson<string[]>(value) ?? [];
}

/** Align with Polymarket buy-side UI: probability 1.0 displays as 0¢. */
export function normalizeSportsOutcomeDisplayPrice(price: number): number {
    if (!Number.isFinite(price)) return NaN;
    return price >= 1 ? 0 : price;
}

export function formatPriceCents(price: string | undefined): string {
    if (!price) return '—';
    const numPrice = Number.parseFloat(price);
    if (Number.isNaN(numPrice)) return '—';
    const displayPrice = normalizeSportsOutcomeDisplayPrice(numPrice);
    if (Number.isNaN(displayPrice)) return '—';
    const cents = removeTrailingZeros((Math.floor(displayPrice * 1000) / 10).toFixed(1));
    return `${cents}¢`;
}

export function parseSportsPriceCentsLabel(priceCents: string): { amount: string; unit?: string } {
    if (!priceCents || priceCents === '—') return { amount: priceCents || '—' };
    if (priceCents.endsWith('¢')) {
        return { amount: priceCents.slice(0, -1), unit: '¢' };
    }
    return { amount: priceCents };
}

export function resolveSportsLivestreamUrl(
    info: PolymarketSportsLivestreamInfo | null | undefined,
): string | undefined {
    if (!info) return undefined;

    const playerUrl = info.player_url?.trim();
    if (playerUrl) return playerUrl;

    const livestreamUrl = info.livestream_url?.trim();
    if (livestreamUrl) return livestreamUrl;

    const legacyUrl = info.url?.trim();
    if (legacyUrl) return legacyUrl;

    return undefined;
}

function formatVolumeLabel(volume: number | undefined): string | undefined {
    if (!volume || volume <= 0) return undefined;
    return `$${nFormatter(volume, 2)}`;
}

function normalizeRecord(record: string | undefined): string | undefined {
    if (!record) return undefined;
    const trimmed = record.replaceAll('(', '').replaceAll(')', '').trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function resolveGamePhase(gameStatus: PolymarketSportsEvent['game_status']): PredictionSportsGamePhase {
    if (gameStatus === 0 || gameStatus === '0' || gameStatus === 'live') return 'live';
    if (gameStatus === 2 || gameStatus === '2' || gameStatus === 'finished') return 'finished';
    return 'scheduled';
}

function getMarketYesAssetId(market: PolymarketSportsMarketData | undefined): string | undefined {
    if (!market) return undefined;
    return parsePolymarketStringArray(market.clobTokenIds)[0];
}

function normalizeTeam(
    teamData: PolymarketSportsMarketTeam | undefined,
    fallbackName: string,
    price: string | undefined,
    score?: number,
    options?: {
        assetId?: string;
        isWinner?: boolean;
        isLoser?: boolean;
        marketSlug?: string;
        outcomeIndex?: number;
    },
): PredictionSportsTeamForUI {
    const displayName = teamData?.alias?.trim() || teamData?.name?.trim() || fallbackName;

    return {
        name: displayName,
        logo: teamData?.logo,
        abbreviation: teamData?.abbreviation ?? teamData?.alias,
        record: normalizeRecord(teamData?.record),
        assetId: options?.assetId,
        marketSlug: options?.marketSlug,
        outcomeIndex: options?.outcomeIndex,
        priceCents: formatPriceCents(price),
        score,
        color: teamData?.color,
        isWinner: options?.isWinner,
        isLoser: options?.isLoser,
    };
}

function findMoneylineMarket(event: PolymarketSportsEvent): PolymarketSportsMarketData | undefined {
    return event.markets?.find((market) => (market as PolymarketSportsMarketData).sportsMarketType === 'moneyline') as
        | PolymarketSportsMarketData
        | undefined;
}

function getMoneylineMarkets(event: PolymarketSportsEvent): PolymarketSportsMarketData[] {
    return (
        (
            event.markets?.filter(
                (market) => (market as PolymarketSportsMarketData).sportsMarketType === 'moneyline',
            ) as PolymarketSportsMarketData[] | undefined
        )?.filter(Boolean) ?? []
    );
}

function getMarketYesPrice(market: PolymarketSportsMarketData | undefined): string | undefined {
    if (!market) return undefined;
    return parsePolymarketStringArray(market.outcomePrices)[0];
}

function isDrawMarketTitle(title: string | undefined): boolean {
    return title?.toLowerCase().includes('draw') ?? false;
}

function matchesTeamMarketTitle(team: PolymarketSportsMarketTeam | undefined, title: string | undefined): boolean {
    if (!team || !title || isDrawMarketTitle(title)) return false;
    const normalizedTitle = title.trim().toLowerCase();
    return [team.name, team.abbreviation, team.alias]
        .filter(Boolean)
        .some((value) => value!.trim().toLowerCase() === normalizedTitle);
}

function resolveThreeWayMarkets(
    markets: PolymarketSportsMarketData[],
    homeTeam: PolymarketSportsMarketTeam,
    awayTeam: PolymarketSportsMarketTeam,
): {
    homeMarket?: PolymarketSportsMarketData;
    drawMarket?: PolymarketSportsMarketData;
    awayMarket?: PolymarketSportsMarketData;
} {
    const byGroupType = (type: number) => markets.find((market) => market.groupTypeFF === type);

    let homeMarket = byGroupType(0);
    let drawMarket = byGroupType(1);
    let awayMarket = byGroupType(2);

    if (!drawMarket) {
        drawMarket = markets.find((market) => isDrawMarketTitle(market.groupItemTitle));
    }
    if (!homeMarket) {
        homeMarket = markets.find((market) => matchesTeamMarketTitle(homeTeam, market.groupItemTitle));
    }
    if (!awayMarket) {
        awayMarket = markets.find(
            (market) =>
                market !== homeMarket &&
                market !== drawMarket &&
                matchesTeamMarketTitle(awayTeam, market.groupItemTitle),
        );
    }
    if (!awayMarket) {
        awayMarket = markets.find((market) => market !== homeMarket && market !== drawMarket);
    }

    return { homeMarket, drawMarket, awayMarket };
}

function resolveThreeWayFinishedFlags(winResult: number | undefined): {
    home: { isWinner?: boolean; isLoser?: boolean };
    away: { isWinner?: boolean; isLoser?: boolean };
    draw: { isWinner?: boolean; isLoser?: boolean };
} {
    if (winResult === 0) {
        return {
            home: { isWinner: true },
            away: { isLoser: true },
            draw: { isLoser: true },
        };
    }
    if (winResult === 2) {
        return {
            home: { isLoser: true },
            away: { isWinner: true },
            draw: { isLoser: true },
        };
    }
    if (winResult === 1) {
        return {
            home: { isLoser: true },
            away: { isLoser: true },
            draw: { isWinner: true },
        };
    }
    return { home: {}, away: {}, draw: {} };
}

function formatThreeWayEvent(event: PolymarketSportsEvent): PredictionSportsCellViewModel | null {
    const drawTeams = event.drawTeams;
    if (!event.isDraw || !drawTeams || drawTeams.length < 2) return null;

    const [homeTeamData, awayTeamData] = drawTeams;
    const moneylineMarkets = getMoneylineMarkets(event);
    if (moneylineMarkets.length < 3) return null;

    const { homeMarket, drawMarket, awayMarket } = resolveThreeWayMarkets(moneylineMarkets, homeTeamData, awayTeamData);
    if (!homeMarket || !drawMarket || !awayMarket) return null;

    const gamePhase = resolveGamePhase(event.game_status);
    const latestScores = event.score_show?.at(-1)?.score;
    const finishedFlags =
        gamePhase === 'finished' ? resolveThreeWayFinishedFlags(event.winResult) : { home: {}, away: {}, draw: {} };

    const startDate = homeMarket.gameStartTime || awayMarket.gameStartTime || event.startDate;
    const startTimeMs = startDate ? new Date(startDate).getTime() : undefined;

    let statusLabel: string | undefined;
    let scheduledTimeLabel: string | undefined;

    if (gamePhase === 'live') {
        statusLabel = event.period_show || undefined;
    } else if (gamePhase === 'finished') {
        statusLabel = event.period_show?.toUpperCase() === 'FINAL' ? event.period_show : 'FINAL';
    } else if (startTimeMs) {
        scheduledTimeLabel = dayjs(startTimeMs).format('h:mm A');
    }

    return {
        eventSlug: event.slug,
        eventId: event.id,
        layout: 'threeWay',
        homeTeam: normalizeTeam(
            homeTeamData,
            homeTeamData.name ?? 'Home',
            getMarketYesPrice(homeMarket),
            latestScores?.[0],
            {
                assetId: getMarketYesAssetId(homeMarket),
                marketSlug: homeMarket.slug,
                outcomeIndex: 0,
                ...finishedFlags.home,
            },
        ),
        awayTeam: normalizeTeam(
            awayTeamData,
            awayTeamData.name ?? 'Away',
            getMarketYesPrice(awayMarket),
            latestScores?.[1],
            {
                assetId: getMarketYesAssetId(awayMarket),
                marketSlug: awayMarket.slug,
                outcomeIndex: 0,
                ...finishedFlags.away,
            },
        ),
        drawOutcome: {
            assetId: getMarketYesAssetId(drawMarket),
            marketSlug: drawMarket.slug,
            outcomeIndex: 0,
            priceCents: formatPriceCents(getMarketYesPrice(drawMarket)),
            ...finishedFlags.draw,
        },
        gamePhase,
        statusLabel,
        scheduledTimeLabel,
        volumeLabel: formatVolumeLabel(event.volume24hr || event.volume),
        leagueLabel: event.leagueName,
        livestreamUrl: gamePhase === 'live' ? resolveSportsLivestreamUrl(event.livestream_info) : undefined,
    };
}

function getTeamsFromMarket(
    market: PolymarketSportsMarketData,
    scores: number[] | undefined,
    winResult?: number,
): PredictionSportsTeamForUI[] {
    const labels = parsePolymarketStringArray(market.outcomes);
    const prices = parsePolymarketStringArray(market.outcomePrices);
    const tokenIds = parsePolymarketStringArray(market.clobTokenIds);

    return labels.map((name, index) => {
        const teamIndex = index + 1;
        const isWinner = winResult === teamIndex;
        const isLoser = winResult !== undefined && winResult > 0 && winResult !== teamIndex;

        return normalizeTeam(market.teams?.[index], name, prices[index], scores?.[index], {
            assetId: tokenIds[index]?.trim() || undefined,
            marketSlug: market.slug,
            outcomeIndex: index,
            isWinner,
            isLoser,
        });
    });
}

export function formatPolymarketSportsEventForUI(event: PolymarketSportsEvent): PredictionSportsCellViewModel | null {
    if (event.isDraw) {
        return formatThreeWayEvent(event);
    }

    const moneyline = findMoneylineMarket(event);
    if (!moneyline) return null;

    const gamePhase = resolveGamePhase(event.game_status);
    const latestScores = event.score_show?.at(-1)?.score;
    const teams = getTeamsFromMarket(moneyline, latestScores, gamePhase === 'finished' ? event.winResult : undefined);
    if (teams.length < 2) return null;

    const startDate = moneyline.gameStartTime || event.startDate;
    const startTimeMs = startDate ? new Date(startDate).getTime() : undefined;

    let statusLabel: string | undefined;
    let scheduledTimeLabel: string | undefined;

    if (gamePhase === 'live') {
        statusLabel = event.period_show || undefined;
    } else if (gamePhase === 'finished') {
        statusLabel = event.period_show?.toUpperCase() === 'FINAL' ? event.period_show : 'FINAL';
    } else if (startTimeMs) {
        scheduledTimeLabel = dayjs(startTimeMs).format('h:mm A');
    }

    return {
        eventSlug: event.slug,
        eventId: event.id,
        layout: 'binary',
        homeTeam: teams[0],
        awayTeam: teams[1],
        gamePhase,
        statusLabel,
        scheduledTimeLabel,
        volumeLabel: formatVolumeLabel(event.volume24hr || event.volume),
        leagueLabel: event.leagueName,
        livestreamUrl: gamePhase === 'live' ? resolveSportsLivestreamUrl(event.livestream_info) : undefined,
    };
}

export function getCategoryHeaderLabel(activeItem: { label: string }): string {
    return activeItem.label;
}
