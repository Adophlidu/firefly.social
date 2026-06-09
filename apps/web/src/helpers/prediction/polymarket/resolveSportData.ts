import { parseJson } from '@dimensiondev/utils';

import { classifySport } from '@/helpers/prediction/sportClassify.js';
import {
    type PolymarketEvent,
    type PolymarketScore,
    PolymarketScoreType,
    type PolymarketTeam,
} from '@/providers/prediction/polymarket/type.js';
import {
    type SportEventData,
    type SportLiveStreamInfo,
    type SportScore,
    SportScoreType,
    type SportTeam,
} from '@/types/prediction.js';

const DEFAULT_HOME_COLOR = '#BB761B';
const DEFAULT_AWAY_COLOR = '#87BFFF';

function mapTeam(raw: PolymarketTeam | undefined, defaultColor: string): SportTeam {
    return {
        id: raw?.id,
        name: raw?.name,
        abbreviation: raw?.abbreviation,
        logo: raw?.logo,
        color: raw?.color || defaultColor,
        record: raw?.record,
    };
}

function withFallbackLabel(team: SportTeam, label: string | undefined): SportTeam {
    if (!label || team.name || team.abbreviation) return team;
    return {
        ...team,
        name: label,
        abbreviation: label,
    };
}

function mapScores(raw: PolymarketEvent): SportScore[] {
    if (raw.score_show?.length) {
        return raw.score_show.map((s: PolymarketScore) => ({
            score: s.score,
            memo: s.memo,
        }));
    }
    if (raw.score) {
        const parts = raw.score.split('-').map(Number);
        if (parts.length === 2 && parts.every((n) => !isNaN(n))) {
            return [{ score: parts }];
        }
    }
    return [];
}

function mapLivestreamInfo(raw: PolymarketEvent): SportLiveStreamInfo | undefined {
    if (!raw.livestream_info) return undefined;
    return {
        livestreamUrl: raw.livestream_info.livestream_url,
        inWhiteList: raw.livestream_info.in_whitelist,
        playerUrl: raw.livestream_info.player_url,
    };
}

function findMoneylineMarket(raw: PolymarketEvent) {
    return raw.markets.find((market) => market.sportsMarketType?.toLowerCase() === 'moneyline') || raw.markets[0];
}

function resolveLeagueSlug(detail: PolymarketEvent): string | undefined {
    const leagueId = detail.leagueId?.trim().toLowerCase();
    if (leagueId) {
        const leagueTag = detail.tags?.find(
            (tag) => tag.slug?.toLowerCase() === leagueId || tag.label?.trim().toLowerCase() === leagueId,
        );
        return leagueTag?.slug || leagueId;
    }

    const leagueName = detail.leagueName?.trim().toLowerCase();
    if (leagueName) {
        const leagueTag = detail.tags?.find(
            (tag) => tag.slug?.toLowerCase() === leagueName || tag.label?.trim().toLowerCase() === leagueName,
        );
        if (leagueTag?.slug) return leagueTag.slug;
    }

    return detail.tags?.find((tag) => {
        const slug = tag.slug?.toLowerCase();
        return slug ? !['sports', 'games'].includes(slug) : false;
    })?.slug;
}

function isMatchEnded(detail: PolymarketEvent): boolean {
    if (detail.ended) return true;
    const gameStatus = detail.gameStatus;
    if (gameStatus === 'finished' || gameStatus === '2') return true;
    if (detail.finishedTimestamp) return true;
    // Some sport events (e.g. ATP tennis) never set ended/gameStatus/finishedTimestamp,
    // but do set closed=true with a winResult when the match completes.
    if (detail.gameId && detail.closed && detail.winResult !== undefined) return true;
    return false;
}

export function resolveSportData(detail: PolymarketEvent): SportEventData | undefined {
    const gameId = detail.gameId;
    if (!gameId) return undefined;

    const moneylineMarket = findMoneylineMarket(detail);
    const teams = detail.drawTeams?.length === 2 ? detail.drawTeams : moneylineMarket?.teams;
    const fallbackOutcomeLabels = parseJson<string[]>(moneylineMarket?.outcomes);
    const homeTeam = withFallbackLabel(mapTeam(teams?.[0], DEFAULT_HOME_COLOR), fallbackOutcomeLabels?.[0]);
    const awayTeam = withFallbackLabel(mapTeam(teams?.[1], DEFAULT_AWAY_COLOR), fallbackOutcomeLabels?.[1]);

    const rawScoreType =
        detail.score_type ??
        (detail.score_show?.length || detail.score ? PolymarketScoreType.Single : PolymarketScoreType.Unknown);
    const scoreType: SportScoreType =
        rawScoreType === PolymarketScoreType.Single
            ? SportScoreType.Single
            : rawScoreType === PolymarketScoreType.Multiple
              ? SportScoreType.Multiple
              : SportScoreType.Unknown;

    // Detect draw markets: 3+ moneyline markets with one containing "draw"
    const moneylineMarkets = detail.markets.filter(
        (m) => m.active && m.sportsMarketType?.toLowerCase() === 'moneyline',
    );
    const hasDrawMarket =
        moneylineMarkets.length >= 3 && moneylineMarkets.some((m) => m.groupItemTitle?.toLowerCase().includes('draw'));

    return {
        gameId,
        live: !!detail.live,
        ended: isMatchEnded(detail),
        homeTeam,
        awayTeam,
        scores: mapScores(detail),
        scoreType,
        period: detail.period_show || detail.period,
        startTime: detail.startTime,
        livestreamInfo: mapLivestreamInfo(detail),
        winResult: detail.winResult,
        isDraw: !!detail.isDraw || hasDrawMarket,
        leagueName: detail.leagueName,
        leagueSlug: resolveLeagueSlug(detail),
        spreadsMainLine: detail.spreadsMainLine,
        totalsMainLine: detail.totalsMainLine,
        sportCategory: classifySport(detail.sportId, detail.leagueName, detail.tags),
    };
}
