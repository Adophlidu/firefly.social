import { FIREFLY_WORKER_HOST, SITE_URL_OFFICIAL } from '@dimensiondev/constants/static';
import { BigNumber } from 'bignumber.js';

import type { PolymarketPosition } from '@/providers/types/Firefly.js';

/**
 * FW-7696 — wallet-side builders for the firefly-workers share-image endpoint
 * (`GET ${FIREFLY_WORKER_HOST}/polymarket/share-image`). The query contract mirrors
 * apps/web/src/helpers/polymarketShareImage.ts.
 */

export interface PolymarketShareIdentity {
    displayName: string;
    avatarUrl?: string;
}

export interface PolymarketSharePositionParams {
    type: 'position';
    title: string;
    outcome: string;
    status: 'active' | 'won' | 'lost';
    pnlRate: number;
    totalCost: number;
    avgPrice: number;
    currentPnl?: number;
    identity: PolymarketShareIdentity;
    qrUrl: string;
}

export interface PolymarketShareWinningsItem {
    title: string;
    cost: number;
    won: number;
    pnlRate: number;
    image?: string;
}

export interface PolymarketShareWinningsParams {
    type: 'winnings';
    totalWon: number;
    items: PolymarketShareWinningsItem[];
    identity: PolymarketShareIdentity;
    qrUrl: string;
}

export type PolymarketShareImageParams = PolymarketSharePositionParams | PolymarketShareWinningsParams;

export interface PolymarketShareImagePayload {
    params: PolymarketShareImageParams;
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

export function buildPolymarketShareImageUrl(params: PolymarketShareImageParams): string {
    const query: Array<[string, string]> = [
        ['type', params.type],
        ['name', params.identity.displayName],
    ];
    if (params.identity.avatarUrl) query.push(['avatar', params.identity.avatarUrl]);
    query.push(['qrUrl', params.qrUrl]);

    if (params.type === 'position') {
        query.push(
            ['title', params.title],
            ['outcome', params.outcome],
            ['status', params.status],
            ['pnlRate', `${params.pnlRate}`],
            ['totalCost', `${params.totalCost}`],
            ['avgPrice', `${params.avgPrice}`],
        );
        if (params.currentPnl !== undefined) query.push(['currentPnl', `${params.currentPnl}`]);
    } else {
        query.push(
            ['totalWon', `${params.totalWon}`],
            [
                'items',
                JSON.stringify(
                    params.items.map((item) => ({
                        title: item.title,
                        cost: `${item.cost}`,
                        won: `${item.won}`,
                        pnlRate: `${item.pnlRate}`,
                        ...(item.image ? { image: item.image } : {}),
                    })),
                ),
            ],
        );
    }

    const search = query.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
    return `${FIREFLY_WORKER_HOST}/polymarket/share-image?${search}`;
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
    // the workers endpoint requires a non-empty name — hide the entry instead of 400ing
    if (!eventSlug || !position.title || !identity.displayName) return null;

    const link = buildPolymarketEventShareUrl(eventSlug);

    if (position.is_closed) {
        const totalBought = position.total_buy || position.shares;
        const totalTrade = BigNumber(position.avg_price).times(totalBought);
        const pnlRate = totalTrade.gt(0)
            ? Math.max(BigNumber(position.pnl).div(totalTrade).toNumber(), -1) * 100
            : position.pnl_rate * 100;
        return {
            link,
            params: {
                type: 'position',
                title: position.title,
                outcome: position.vote_status,
                status: position.pnl > 0 ? 'won' : 'lost',
                pnlRate,
                totalCost: totalTrade.toNumber(),
                avgPrice: position.avg_price,
                currentPnl: position.pnl,
                identity,
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
            totalCost: BigNumber(position.avg_price).times(position.shares).toNumber(),
            avgPrice: position.avg_price,
            currentPnl: position.pnl,
            identity,
            qrUrl: link,
        },
    };
}

/**
 * Builds the share payload for the "Claim all the winnings" dialog. A single winning renders the
 * closed-position style (spec AC-5), so it is sent as `type=position` with full data.
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
    return {
        link,
        params: {
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
            qrUrl: link,
        },
    };
}
