import { SITE_URL_OFFICIAL } from '@dimensiondev/constants/static';
import type {
    PolymarketShareBridgeParams,
    PolymarketSharePositionBridgeParams,
    PolymarketShareWinningsBridgeParams,
} from '@dimensiondev/iframe-bridge';
import { BigNumber } from 'bignumber.js';

import type { PolymarketPosition } from '@/providers/types/Firefly.js';

/**
 * FW-7810 — wallet-side builders for the Polymarket share image. The image is rendered by the host
 * (firefly.social web) via the iframe bridge, reusing its client-side satori renderer; these builders
 * just assemble the params. The param shapes mirror apps/web/src/helpers/polymarketShareImage.ts (kept
 * in sync through the bridge package's structural types).
 */

export interface PolymarketShareIdentity {
    displayName: string;
    avatarUrl?: string;
}

export interface PolymarketShareImagePayload {
    params: PolymarketShareBridgeParams;
    /** The firefly detail link carried as the compose text. */
    link: string;
}

function appendSid(url: string, sharerUid?: string) {
    return sharerUid ? `${url}?sid=${encodeURIComponent(sharerUid)}` : url;
}

export function buildPolymarketEventShareUrl(eventSlug: string, sharerUid?: string): string {
    return appendSid(`${SITE_URL_OFFICIAL}/polymarket/event/${encodeURIComponent(eventSlug)}`, sharerUid);
}

export function buildPolymarketProfileShareUrl(proxyAddress: string, sharerUid?: string): string {
    return appendSid(`${SITE_URL_OFFICIAL}/polymarket/profile/${encodeURIComponent(proxyAddress)}`, sharerUid);
}

function shortenAddress(address: string) {
    return address.length > 10 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
}

export function fallbackShareIdentity(address: string): PolymarketShareIdentity {
    return { displayName: shortenAddress(address) };
}

/** Builds the share payload for a wallet position cell (active or closed). */
export function getPositionShareImagePayload(
    position: PolymarketPosition,
    identity: PolymarketShareIdentity,
): PolymarketShareImagePayload | null {
    const eventSlug = position.event_slugs?.[0] || position.marketSlug;
    if (!eventSlug || !position.title || !identity.displayName) return null;

    const link = buildPolymarketEventShareUrl(eventSlug);

    if (position.is_closed) {
        const totalBought = position.total_buy || position.shares;
        const totalTrade = BigNumber(position.avg_price).times(totalBought);
        const pnlRate = totalTrade.gt(0)
            ? Math.max(BigNumber(position.pnl).div(totalTrade).toNumber(), -1) * 100
            : position.pnl_rate * 100;
        const params: PolymarketSharePositionBridgeParams = {
            type: 'position',
            title: position.title,
            outcome: position.vote_status,
            status: position.pnl > 0 ? 'won' : 'lost',
            pnlRate,
            totalCost: totalTrade.toNumber(),
            avgPrice: position.avg_price,
            currentPnl: position.pnl,
            identity,
            imageUrl: position.image || undefined,
        };
        return { link, params };
    }

    const params: PolymarketSharePositionBridgeParams = {
        type: 'position',
        title: position.title,
        outcome: position.vote_status,
        status: 'active',
        pnlRate: position.pnl_rate * 100,
        totalCost: BigNumber(position.avg_price).times(position.shares).toNumber(),
        avgPrice: position.avg_price,
        currentPnl: position.pnl,
        identity,
        imageUrl: position.image || undefined,
    };
    return { link, params };
}

/**
 * Builds the share payload for the "Claim all the winnings" dialog. A single winning renders the
 * closed-position card; multiple render the TOTAL WON summary card.
 */
export function getWinningsShareImagePayload(
    winningItems: PolymarketPosition[],
    totalWinAmount: number,
    proxyAddress: string,
    identity: PolymarketShareIdentity,
): PolymarketShareImagePayload | null {
    if (!winningItems.length || !identity.displayName) return null;

    if (winningItems.length === 1) {
        return getPositionShareImagePayload({ ...winningItems[0], is_closed: true }, identity);
    }

    const link = buildPolymarketProfileShareUrl(proxyAddress);
    const params: PolymarketShareWinningsBridgeParams = {
        type: 'winnings',
        totalWon: totalWinAmount,
        items: winningItems.map((item) => ({
            title: item.title,
            cost: BigNumber(item.shares ?? 0)
                .times(item.avg_price ?? 0)
                .toNumber(),
            // resolved winning shares pay out $1 each
            won: item.shares ?? 0,
            pnlRate: (item.pnl_rate ?? 0) * 100,
            image: item.image || undefined,
        })),
        identity,
    };
    return { link, params };
}
