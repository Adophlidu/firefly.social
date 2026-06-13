import { FIREFLY_WORKER_HOST } from '@dimensiondev/constants/static';
import { SITE_URL } from '@dimensiondev/envs/web';
import urlcat from 'urlcat';

export interface PolymarketShareIdentity {
    displayName: string;
    avatarUrl?: string;
}

export interface PolymarketShareIdentityCandidates {
    firefly?: PolymarketShareIdentity;
    polymarket?: PolymarketShareIdentity;
    twitter?: PolymarketShareIdentity;
    lens?: PolymarketShareIdentity;
    farcaster?: PolymarketShareIdentity;
    bluesky?: PolymarketShareIdentity;
}

const IDENTITY_PRIORITY = ['firefly', 'polymarket', 'twitter', 'lens', 'farcaster', 'bluesky'] as const;

/**
 * FW-7696 AC-14 — the avatar+name shown on the share image resolves by priority:
 * ff account > polymarket account > social (X > Lens > Farcaster > Bluesky).
 */
export function resolvePolymarketShareIdentity(
    candidates: PolymarketShareIdentityCandidates,
): PolymarketShareIdentity | null {
    for (const key of IDENTITY_PRIORITY) {
        const identity = candidates[key];
        if (identity) return identity;
    }

    return null;
}

/**
 * FW-7696 AC-18 — predictions-timeline PnL% = (currentPrice - averagePrice) / averagePrice,
 * expressed in percent.
 */
export function computeTimelinePnlRate(params: { averagePrice: number; currentPrice: number }): number {
    const { averagePrice, currentPrice } = params;
    return ((currentPrice - averagePrice) / averagePrice) * 100;
}

export interface SharePnlHeadline {
    label: string;
    positive: boolean;
}

/**
 * FW-7696 AC-18 — headline PnL formatting: explicit "+" for gains, 0 counts as positive (green),
 * exactly -100% becomes the red "Full Loss" headline.
 */
export function formatSharePnlHeadline(pnlRate: number): SharePnlHeadline {
    const rounded = Math.round(pnlRate * 100) / 100;
    // rates come from floating-point pnl / cost math, so a real full loss can arrive as
    // -99.99999994 — compare at the displayed precision
    if (rounded === -100) return { label: 'Full Loss', positive: false };
    const sign = rounded >= 0 ? '+' : '';
    return { label: `${sign}${rounded}%`, positive: rounded >= 0 };
}

function appendSid(url: string, sharerUid?: string) {
    return sharerUid ? `${url}?sid=${encodeURIComponent(sharerUid)}` : url;
}

/** FW-7696 — market detail link encoded into the single-position QR code. */
export function buildPolymarketEventShareUrl(eventSlug: string, sharerUid?: string): string {
    return appendSid(urlcat(SITE_URL, '/polymarket/event/:slug', { slug: eventSlug }), sharerUid);
}

/** FW-7696 — wallet profile link encoded into the multi-winnings QR code. */
export function buildPolymarketProfileShareUrl(proxyAddress: string, sharerUid?: string): string {
    return appendSid(urlcat(SITE_URL, '/polymarket/profile/:address', { address: proxyAddress }), sharerUid);
}

export type PolymarketSharePositionStatus = 'active' | 'won' | 'lost';

export interface PolymarketSharePositionParams {
    type: 'position';
    title: string;
    outcome: string;
    status: PolymarketSharePositionStatus;
    pnlRate: number;
    totalCost: number;
    avgPrice: number;
    currentPnl?: number;
    identity: PolymarketShareIdentity;
    qrUrl: string;
    /** timeline cells render "Predicted" and omit the Current PnL row */
    variant?: 'timeline';
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

/**
 * FW-7696 AC-18 — builds the firefly-workers share-image endpoint URL
 * (`GET ${FIREFLY_WORKER_HOST}/polymarket/share-image`) from position/winnings data.
 */
export function buildPolymarketShareImageUrl(params: PolymarketShareImageParams): string {
    // encodeURIComponent (%20 for spaces) instead of URLSearchParams ("+" for spaces) so the query
    // survives a plain decodeURIComponent round-trip on the consumer side.
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
        if (params.variant) query.push(['variant', params.variant]);
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
