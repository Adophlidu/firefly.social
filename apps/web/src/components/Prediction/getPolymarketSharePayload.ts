import { formatAddressEthereum } from '@dimensiondev/web3/utils';
import { first } from 'lodash-es';

import {
    buildPolymarketEventShareUrl,
    computeTimelinePnlRate,
    type PolymarketShareIdentity,
    resolvePolymarketShareIdentity,
} from '@/helpers/polymarketShareImage.js';
import type { PolymarketShareImagePayload } from '@/hooks/prediction/usePolymarketShareImageActions.js';
import type { BetsActivity, WalletProfileInfo } from '@/providers/types/Firefly.js';
import type { PredictionPositionDataForUI } from '@/types/prediction.js';

/**
 * FW-7696 AC-14 — assembles the identity candidates a profile surface knows about and resolves
 * them by priority (ff > polymarket > X > Lens > Farcaster > Bluesky).
 */
export function resolveShareIdentityFromWalletProfile(
    walletProfile: WalletProfileInfo | null | undefined,
    polymarket?: { name?: string; avatar?: string },
): PolymarketShareIdentity | null {
    const twitter = first(walletProfile?.twitterProfiles);
    const lens = first(walletProfile?.lensProfilesV3);
    const farcaster = first(walletProfile?.farcasterProfiles);
    const bluesky = first(walletProfile?.bskyProfiles);

    return resolvePolymarketShareIdentity({
        polymarket: polymarket?.name ? { displayName: polymarket.name, avatarUrl: polymarket.avatar } : undefined,
        twitter: twitter?.handle ? { displayName: twitter.handle } : undefined,
        lens: lens?.localName ? { displayName: lens.localName } : undefined,
        farcaster: farcaster?.display_name
            ? { displayName: farcaster.display_name, avatarUrl: farcaster.avatar?.url }
            : undefined,
        bluesky: bluesky?.handle ? { displayName: bluesky.handle } : undefined,
    });
}

function fallbackIdentity(address: string | undefined): PolymarketShareIdentity | null {
    return address ? { displayName: formatAddressEthereum(address, 4) } : null;
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

    if (position.is_closed) {
        const totalBought = position.total_buy || position.shares;
        const totalTrade = position.avg_price * totalBought;
        const pnlRate = Math.max(-1, totalTrade > 0 ? position.pnl / totalTrade : position.pnl_rate) * 100;
        return {
            link,
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
                qrUrl: link,
            },
        };
    }

    return {
        link,
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
            qrUrl: link,
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

    const identity = resolvePolymarketShareIdentity({
        firefly: activity.displayInfo?.fireflyName
            ? {
                  displayName: activity.displayInfo.fireflyName,
                  avatarUrl: activity.displayInfo.fireflyAvatarUrl ?? undefined,
              }
            : undefined,
    });
    const resolvedIdentity =
        identity ??
        (activity.displayInfo?.ensHandle
            ? { displayName: activity.displayInfo.ensHandle, avatarUrl: activity.displayInfo.avatarUrl ?? undefined }
            : fallbackIdentity(activity.wallet || activity.proxyWallet || activity.owner));
    if (!resolvedIdentity) return null;

    const averagePrice = Number.parseFloat(activity.avgPrice || activity.price);
    const currentPrice = Number.parseFloat(activity.conditionOutcomePrices?.[activity.outcomeIndex] ?? activity.price);
    if (!Number.isFinite(averagePrice) || averagePrice <= 0 || !Number.isFinite(currentPrice)) return null;

    const ended = activity.umaResolutionStatus === 'resolved';
    const won = ended && activity.resolvedResult === activity.outcomeIndex;
    const lost = ended && !won;
    const pnlRate = lost ? -100 : computeTimelinePnlRate({ averagePrice, currentPrice });

    const totalCost = Number.parseFloat(activity.usdcSize);

    return {
        link,
        params: {
            type: 'position',
            variant: 'timeline',
            title: activity.title,
            outcome: activity.outcome,
            status: ended ? (won ? 'won' : 'lost') : 'active',
            pnlRate,
            totalCost: Number.isFinite(totalCost) ? totalCost : 0,
            avgPrice: averagePrice,
            identity: resolvedIdentity,
            qrUrl: link,
        },
    };
}
