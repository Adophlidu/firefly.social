import { PredictionPlatform } from '@dimensiondev/enums';
import { formatAddress, formatAddressEthereum } from '@dimensiondev/web3/utils';
import { first } from 'lodash-es';

import { getEnsNameFromDisplayInfo } from '@/helpers/getEnsNameFromDisplayInfo.js';
import { getWalletProfileAvatar } from '@/helpers/getWalletProfileAvatar.js';
import {
    buildPolymarketEventShareUrl,
    computeTimelinePnlRate,
    type PolymarketShareIdentity,
    type PolymarketShareSportInfo,
    type PolymarketShareSportTeam,
} from '@/helpers/polymarketShareImage.js';
import type { PolymarketShareImagePayload } from '@/hooks/prediction/usePolymarketShareImageActions.js';
import { getEventDetail } from '@/providers/firefly/prediction/getEventDetail.js';
import type { BetsActivity } from '@/providers/types/Firefly.js';
import type { BetsEventDataForUI, PredictionPositionDataForUI } from '@/types/prediction.js';

/** Minimal team shape shared by `SportActivityTeam` (timeline) and `SportTeam` (event detail). */
interface RawShareTeam {
    name?: string;
    abbreviation?: string;
    logo?: string;
}

function fallbackIdentity(address: string | undefined): PolymarketShareIdentity | null {
    return address ? { displayName: formatAddressEthereum(address, 4) } : null;
}

function toShareTeam(team: RawShareTeam): PolymarketShareSportTeam {
    return { name: team.name || team.abbreviation || '', logo: team.logo };
}

function sumScore(rows: Array<{ score?: number[] }> | undefined): [number, number] | undefined {
    if (!rows?.length) return undefined;
    return rows.reduce<[number, number]>(
        (acc, row) => [acc[0] + (row.score?.[0] ?? 0), acc[1] + (row.score?.[1] ?? 0)],
        [0, 0],
    );
}

// Builds the matchup context from already-resolved home/away teams, score rows and the bet outcome.
// `outcomeIndex` 0 = home, 1 = away; an explicit "draw" outcome on a 3-way market is a draw pick.
function buildSportInfo(params: {
    home: RawShareTeam;
    away: RawShareTeam;
    scoreRows: Array<{ score?: number[] }> | undefined;
    isDraw: boolean;
    outcomeIndex: number | undefined;
    outcome: string;
}): PolymarketShareSportInfo {
    const { home, away, scoreRows, isDraw, outcomeIndex, outcome } = params;
    const isDrawPick = isDraw && outcome.trim().toLowerCase() === 'draw';
    const predicted: PolymarketShareSportInfo['predicted'] = isDrawPick
        ? { kind: 'draw' }
        : { kind: 'team', team: toShareTeam(outcomeIndex === 1 ? away : home) };

    return { home: toShareTeam(home), away: toShareTeam(away), score: sumScore(scoreRows), predicted };
}

/**
 * Maps a sports activity's `sportData` to the share image's matchup context. Returns undefined for
 * non-sports markets (→ the event card). `marketTeams` is `[home, away]`.
 */
function buildShareSportInfo(activity: BetsActivity): PolymarketShareSportInfo | undefined {
    const sport = activity.sportData;
    const teams = sport?.marketTeams?.length === 2 ? sport.marketTeams : sport?.drawTeams;
    if (!sport || !teams || teams.length < 2) return undefined;

    return buildSportInfo({
        home: teams[0],
        away: teams[1],
        scoreRows: sport.scoreShow,
        isDraw: !!sport.isDraw,
        outcomeIndex: activity.outcomeIndex,
        outcome: activity.outcome || '',
    });
}

/**
 * Position-cell sports context: the position-list API carries no team/score data, so it is fetched
 * on demand (only when the user actually shares) via the event detail. Returns undefined for
 * non-sports markets. Wrapped in a thunk on the payload so cell hover/render pays nothing.
 */
// Session cache for the on-demand event-detail fetch, keyed by event slug — React's `cache()` only
// dedupes within a server render, so it does nothing for the client share flow. Sharing the same
// position twice (e.g. "Post with image" then "Share image"), or two positions of the same event,
// reuses one request. Failures are evicted so a later attempt can retry.
const eventDetailCache = new Map<string, Promise<BetsEventDataForUI | null>>();

function fetchEventDetailCached(eventSlug: string): Promise<BetsEventDataForUI | null> {
    const cached = eventDetailCache.get(eventSlug);
    if (cached) return cached;

    const promise = getEventDetail(PredictionPlatform.Polymarket, { id: eventSlug, isMutil: false });
    eventDetailCache.set(eventSlug, promise);
    void promise.catch(() => eventDetailCache.delete(eventSlug));
    return promise;
}

function resolvePositionSport(
    position: PredictionPositionDataForUI,
    eventSlug: string,
): () => Promise<PolymarketShareSportInfo | undefined> {
    return async () => {
        const detail = await fetchEventDetailCached(eventSlug);
        const sport = detail?.sportData;
        if (!sport?.homeTeam || !sport.awayTeam) return undefined;

        return buildSportInfo({
            home: sport.homeTeam,
            away: sport.awayTeam,
            scoreRows: sport.scores,
            isDraw: sport.isDraw,
            outcomeIndex: position.outcomeIndex,
            outcome: position.vote_status,
        });
    };
}

/** Builds the share payload for a position cell (active or closed). Polymarket only. */
export function getPositionShareImagePayload(
    position: PredictionPositionDataForUI,
    identity: PolymarketShareIdentity | null,
    sharerUid: string | undefined,
    ownerAddress?: string,
): PolymarketShareImagePayload | null {
    const eventSlug = first(position.event_slugs) || position.marketSlug;
    const resolvedIdentity = identity ?? fallbackIdentity(ownerAddress);
    if (!eventSlug || !position.title || !resolvedIdentity) return null;

    const link = buildPolymarketEventShareUrl(eventSlug, sharerUid);
    const resolveSport = resolvePositionSport(position, eventSlug);

    if (position.is_closed) {
        const totalBought = position.total_buy || position.shares;
        const totalTrade = position.avg_price * totalBought;
        const pnlRate = Math.max(-1, totalTrade > 0 ? position.pnl / totalTrade : position.pnl_rate) * 100;
        return {
            link,
            resolveSport,
            params: {
                type: 'position',
                title: position.title,
                outcome: position.vote_status,
                status: position.pnl > 0 ? 'won' : 'lost',
                pnlRate,
                totalCost: totalTrade,
                avgPrice: position.avg_price,
                currentPnl: position.pnl,
                identity: resolvedIdentity,
                imageUrl: position.image,
            },
        };
    }

    return {
        link,
        resolveSport,
        params: {
            type: 'position',
            title: position.title,
            outcome: position.vote_status,
            status: 'active',
            pnlRate: position.pnl_rate * 100,
            totalCost: position.avg_price * position.shares,
            avgPrice: position.avg_price,
            currentPnl: position.pnl,
            identity: resolvedIdentity,
            imageUrl: position.image,
        },
    };
}

/**
 * Builds the share payload for a predictions-timeline activity. PnL% = (cur − avg) / avg; when the
 * market resolved against the predicted outcome it becomes a Full Loss (-100%).
 */
export function getActivityShareImagePayload(
    activity: BetsActivity,
    /** the firefly detail link — `useShareUrl` already appended the sharer's `sid` */
    link: string,
): PolymarketShareImagePayload | null {
    if (!activity.title || !activity.outcome) return null;

    // FW-7696 AC-14 — the share image must show the same user the timeline cell renders. Reuse the
    // list item's identity source (getEnsNameFromDisplayInfo + getWalletProfileAvatar), which already
    // resolves the display name/avatar by the firefly > social account priority via displayInfoV2.
    const walletAddress = activity.wallet || activity.proxyWallet || activity.owner;
    const displayName =
        getEnsNameFromDisplayInfo(activity, walletAddress ?? '') ??
        (walletAddress ? formatAddress(walletAddress, 4) : undefined);
    if (!displayName) return null;
    const resolvedIdentity: PolymarketShareIdentity = {
        displayName,
        avatarUrl: getWalletProfileAvatar(activity.displayInfo),
    };

    const averagePrice = Number.parseFloat(activity.avgPrice || activity.price);
    const currentPrice = Number.parseFloat(activity.conditionOutcomePrices?.[activity.outcomeIndex] ?? activity.price);
    if (!Number.isFinite(averagePrice) || averagePrice <= 0 || !Number.isFinite(currentPrice)) return null;

    const ended = activity.umaResolutionStatus === 'resolved';
    const won = ended && activity.resolvedResult === activity.outcomeIndex;
    const lost = ended && !won;
    const pnlRate = lost ? -100 : computeTimelinePnlRate({ averagePrice, currentPrice });

    const totalCost = Number.parseFloat(activity.usdcSize);
    const cost = Number.isFinite(totalCost) ? totalCost : 0;
    // pnlRate is the return relative to cost, so the dollar PnL is cost × rate (unrealized while
    // active, the realized profit when won, and −cost on a full loss). The timeline activity has no
    // direct pnl field, unlike a position cell.
    const currentPnl = (cost * pnlRate) / 100;

    return {
        link,
        params: {
            type: 'position',
            variant: 'timeline',
            title: activity.title,
            outcome: activity.outcome,
            status: ended ? (won ? 'won' : 'lost') : 'active',
            pnlRate,
            totalCost: cost,
            avgPrice: averagePrice,
            currentPnl,
            identity: resolvedIdentity,
            imageUrl: activity.icon || activity.image,
            sport: buildShareSportInfo(activity),
        },
    };
}
