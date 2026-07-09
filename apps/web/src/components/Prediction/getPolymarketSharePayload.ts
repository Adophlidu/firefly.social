import { PredictionPlatform, Source } from '@dimensiondev/enums';
import { formatAddress, formatAddressEthereum } from '@dimensiondev/web3/utils';
import { first } from 'lodash-es';

import { extractFallbackInfo } from '@/components/Prediction/extractFallbackInfo.js';
import { mapV2ToUI } from '@/components/Prediction/getPredictionPositionList.js';
import { getEnsNameFromDisplayInfo } from '@/helpers/getEnsNameFromDisplayInfo.js';
import { getWalletProfileAvatar } from '@/helpers/getWalletProfileAvatar.js';
import {
    buildPolymarketEventShareUrl,
    computeTimelinePnlRate,
    type PolymarketShareIdentity,
    type PolymarketSharePositionParams,
    type PolymarketShareSportInfo,
    type PolymarketShareSportTeam,
    resolvePredictedSide,
} from '@/helpers/polymarketShareImage.js';
import { pickWalletProfileByAddress } from '@/helpers/prediction/pickWalletProfileByAddress.js';
import { computePositionShareMetrics } from '@/helpers/prediction/polymarket/computePositionShareMetrics.js';
import { findMatchingPosition } from '@/helpers/prediction/polymarket/findMatchingPosition.js';
import type { PolymarketShareImagePayload } from '@/hooks/prediction/usePolymarketShareImageActions.js';
import { getClosedPositions } from '@/providers/firefly/prediction/getClosedPositions.js';
import { getCurrentPositions } from '@/providers/firefly/prediction/getCurrentPositions.js';
import { getEventDetail } from '@/providers/firefly/prediction/getEventDetail.js';
import { getProfile } from '@/providers/firefly/prediction/getProfile.js';
import { getRedeemablePositions } from '@/providers/firefly/prediction/getRedeemablePositions.js';
import { getWalletProfileInfoList } from '@/providers/firefly/prediction/getWalletProfileInfoList.js';
import type { BetsActivity } from '@/providers/types/Firefly.js';
import type { BetsEventDataForUI, PredictionPositionDataForUI } from '@/types/prediction.js';

/** Minimal team shape shared by `SportActivityTeam` (timeline) and `SportTeam` (event detail). */
interface RawShareTeam {
    name?: string;
    abbreviation?: string;
    /** Alternate name (event-detail teams only) — used when matching the outcome/title to a team. */
    alias?: string;
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
// The predicted side is resolved by `resolvePredictedSide`: the outcome label / market title decide it
// (moneyline outcomes are team names; binary "Will <Team> win?" markets name the team in the title),
// falling back to the legacy outcomeIndex mapping (0 = home, 1 = away).
function buildSportInfo(params: {
    home: RawShareTeam;
    away: RawShareTeam;
    scoreRows: Array<{ score?: number[] }> | undefined;
    isDraw: boolean;
    outcomeIndex: number | undefined;
    outcome: string;
    title: string;
}): PolymarketShareSportInfo {
    const { home, away, scoreRows, isDraw, outcomeIndex, outcome, title } = params;
    const side = resolvePredictedSide({ home, away, outcome, title, isDraw, outcomeIndex });
    const predicted: PolymarketShareSportInfo['predicted'] =
        side === 'draw' ? { kind: 'draw' } : { kind: 'team', team: toShareTeam(side === 'away' ? away : home) };

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
        title: activity.title || '',
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

/**
 * Resolves the sports matchup context for a position share from its event slug + bet outcome. Returns
 * undefined for non-sports markets. Shared by the web position cell and the wallet iframe-bridge handler
 * (the wallet can't build `sport` itself, so it passes the event slug and the host resolves it here).
 */
export async function resolveShareSportInfo(input: {
    eventSlug: string;
    outcomeIndex: number | undefined;
    outcome: string;
    title: string;
}): Promise<PolymarketShareSportInfo | undefined> {
    const detail = await fetchEventDetailCached(input.eventSlug);
    const sport = detail?.sportData;
    if (!sport?.homeTeam || !sport.awayTeam) return undefined;

    return buildSportInfo({
        home: sport.homeTeam,
        away: sport.awayTeam,
        scoreRows: sport.scores,
        isDraw: sport.isDraw,
        outcomeIndex: input.outcomeIndex,
        outcome: input.outcome,
        title: input.title,
    });
}

function resolvePositionSport(
    position: PredictionPositionDataForUI,
    eventSlug: string,
): () => Promise<PolymarketShareSportInfo | undefined> {
    return () =>
        resolveShareSportInfo({
            eventSlug,
            outcomeIndex: position.outcomeIndex,
            outcome: position.vote_status,
            title: position.title ?? '',
        });
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

    return {
        link,
        resolveSport,
        params: {
            type: 'position',
            title: position.title,
            outcome: position.vote_status,
            identity: resolvedIdentity,
            imageUrl: position.image,
            ...computePositionShareMetrics(position),
        },
    };
}

// FW-7848 — a timeline activity's share must match the wallet's position share: the same holder
// identity and the server-authoritative PnL, not the per-activity approximation below. Both are
// resolved on demand at share time (like `resolveSport`), so the feed render pays nothing.
const activityIdentityCache = new Map<string, Promise<PolymarketShareIdentity | null>>();
const activityPositionCache = new Map<string, Promise<PredictionPositionDataForUI | null>>();

// Only the first page of positions is scanned; a match beyond it falls back to the computed value.
// A recently-placed bet (the usual share) sits near the top of the CURRENT / TIMESTAMP-DESC lists.
const POSITION_SCAN_LIMIT = 100;

/**
 * Memoizes an on-demand resolver, evicting the entry when it rejects OR resolves to null so a later
 * share retries (e.g. a just-placed bet the backend hasn't indexed yet).
 */
function memoizeResolver<T>(
    cache: Map<string, Promise<T | null>>,
    key: string,
    factory: () => Promise<T | null>,
): Promise<T | null> {
    const cached = cache.get(key);
    if (cached) return cached;

    const promise = factory();
    cache.set(key, promise);
    void promise.then(
        (value) => {
            if (value === null) cache.delete(key);
        },
        () => cache.delete(key),
    );
    return promise;
}

/**
 * Resolves the holder's social identity from `/v2/wallet/profileinfo/list`, following the same source
 * and priority the wallet share and the web profile page use (`resolveShareIdentityFromProfile` /
 * `usePredictionProfileData`): Firefly > Twitter > Lens > Farcaster > Bsky > Wallet. `proxyAddress` is
 * the Polymarket proxy, so the lookup runs with `is_polymarketProxy = true`. `avatarUrl` may be
 * undefined (a resolved name with no avatar) — the caller keeps the timeline avatar in that case.
 */
function resolveActivityShareIdentity(proxyAddress: string): Promise<PolymarketShareIdentity | null> {
    return memoizeResolver(activityIdentityCache, proxyAddress.toLowerCase(), async () => {
        const [walletProfilesResponse, profileResponse] = await Promise.allSettled([
            getWalletProfileInfoList(proxyAddress, PredictionPlatform.Polymarket, true),
            getProfile(proxyAddress, true),
        ]);
        const walletProfiles = walletProfilesResponse.status === 'fulfilled' ? walletProfilesResponse.value : null;
        const polymarketProfile = profileResponse.status === 'fulfilled' ? profileResponse.value : null;
        if (!walletProfiles && !polymarketProfile) return null;

        const profile = pickWalletProfileByAddress(walletProfiles, proxyAddress);
        if (polymarketProfile?.platform_name && !profile?.account) {
            return {
                displayName: polymarketProfile.platform_name,
                avatarUrl: polymarketProfile.platform_avatar || undefined,
            };
        }
        if (!profile) return null;

        const { name, avatar } = extractFallbackInfo(profile, [
            Source.Firefly,
            Source.Twitter,
            Source.Lens,
            Source.Farcaster,
            Source.Bsky,
            Source.Wallet,
        ]);
        return name ? { displayName: name, avatarUrl: avatar } : null;
    });
}

/**
 * Fetches the holder's authoritative position for the activity's market outcome, matched by
 * `(conditionId, outcomeIndex)` — the unambiguous key both surfaces share. Current positions are
 * scanned first, then redeemable + closed. The raw V2 rows are used (not `getPredictionPositionList`,
 * whose closed path dedupes by conditionId and would drop the other outcome of a two-sided holding).
 * Returns null when no position matches → the caller keeps the computed approximation.
 */
function resolveActivityPosition(input: {
    proxyAddress: string;
    conditionId: string;
    outcomeIndex: number;
}): Promise<PredictionPositionDataForUI | null> {
    const key = `${input.proxyAddress.toLowerCase()}:${input.conditionId.toLowerCase()}:${input.outcomeIndex}`;
    return memoizeResolver(activityPositionCache, key, async () => {
        const current = await getCurrentPositions({ address: input.proxyAddress, limit: POSITION_SCAN_LIMIT });
        const inCurrent = findMatchingPosition(
            current.data.map((position) => mapV2ToUI(position, false)),
            input.conditionId,
            input.outcomeIndex,
        );
        if (inCurrent) return inCurrent;

        const [redeemable, closed] = await Promise.all([
            getRedeemablePositions({ address: input.proxyAddress }),
            getClosedPositions({ address: input.proxyAddress, limit: POSITION_SCAN_LIMIT }),
        ]);
        const closedUI = [...redeemable, ...closed.data].map((position) => mapV2ToUI(position, true));
        return findMatchingPosition(closedUI, input.conditionId, input.outcomeIndex);
    });
}

/**
 * FW-7848 — resolves the share-param overrides that align a timeline activity's share image with the
 * wallet's position share: the holder's social identity and the server-authoritative PnL. Best-effort
 * — anything that fails to resolve is omitted, leaving the computed timeline value in place. Returns
 * undefined when nothing resolved.
 */
async function resolveActivityShareOverrides(
    activity: BetsActivity,
): Promise<Partial<PolymarketSharePositionParams> | undefined> {
    // The Polymarket positions and proxy-profile lookups are both keyed by the proxy address.
    const proxyAddress = activity.proxyWallet || activity.wallet || activity.owner;
    if (!proxyAddress) return undefined;

    const [identity, position] = await Promise.all([
        resolveActivityShareIdentity(proxyAddress).catch(() => null),
        activity.conditionId
            ? resolveActivityPosition({
                  proxyAddress,
                  conditionId: activity.conditionId,
                  outcomeIndex: activity.outcomeIndex,
              }).catch(() => null)
            : Promise.resolve(null),
    ]);

    const overrides: Partial<PolymarketSharePositionParams> = {};

    if (identity) {
        overrides.identity = {
            displayName: identity.displayName,
            // Keep the timeline cell's avatar when the resolved identity has none, mirroring
            // usePredictionProfileData's `socialAvatar || fallback` so a source that yields a name
            // but no avatar doesn't blank the card.
            avatarUrl: identity.avatarUrl || getWalletProfileAvatar(activity.displayInfo),
        };
    }

    if (position) {
        const metrics = computePositionShareMetrics(position);
        overrides.pnlRate = metrics.pnlRate;
        overrides.totalCost = metrics.totalCost;
        overrides.avgPrice = metrics.avgPrice;
        overrides.currentPnl = metrics.currentPnl;
        // Only a definitively closed position carries an authoritative won/lost; an open position is
        // always 'active', so keep the timeline's status there rather than downgrading a bet whose
        // market has already resolved.
        if (position.is_closed) overrides.status = metrics.status;
    }

    return Object.keys(overrides).length ? overrides : undefined;
}

/**
 * Builds the share payload for a predictions-timeline activity. PnL% = (cur − avg) / avg; when the
 * market resolved against the predicted outcome it becomes a Full Loss (-100%).
 *
 * At share time `resolveOverrides` aligns the identity + PnL with the wallet's authoritative position
 * (FW-7848); the values below are the render-cheap fallback used until (or if) that resolves.
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
        resolveOverrides: () => resolveActivityShareOverrides(activity),
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
