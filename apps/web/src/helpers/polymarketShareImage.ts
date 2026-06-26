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

/** One side of a sports matchup rendered on the share image. */
export interface PolymarketShareSportTeam {
    name: string;
    /** Remote team-logo / flag URL (fetched into a data URI at render time). */
    logo?: string;
}

/**
 * Sports context for a position share. Present only for sports markets; when set, the share image
 * renders the sports card (avatar+name header, predicted-side badge, teams + score footer) instead
 * of the event card.
 */
export interface PolymarketShareSportInfo {
    home: PolymarketShareSportTeam;
    away: PolymarketShareSportTeam;
    /** `[home, away]` final/live score, omitted when the game has not produced one (renders "vs."). */
    score?: [number, number];
    /** The side the user predicted — a team badge, or a "DRAW" pick. */
    predicted: { kind: 'team'; team: PolymarketShareSportTeam } | { kind: 'draw' };
}

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
    /** Market icon URL shown on the event card (fetched into a data URI at render time). */
    imageUrl?: string;
    /** Sports matchup context; switches the layout to the sports card when present. */
    sport?: PolymarketShareSportInfo;
    /** timeline cells render "Predicted" and omit the Current PnL row */
    variant?: 'timeline';
}

export interface PolymarketShareWinningsItem {
    title: string;
    cost: number;
    /** Payout in USD (resolved winning shares pay $1 each). */
    won: number;
    pnlRate: number;
    /** Market icon URL (fetched into a data URI at render time). */
    image?: string;
}

/**
 * Multi-market winnings summary ("Claim all" / TOTAL WON card, Figma 84050:57504 / 84050:57392).
 * Used by apps/wallet via the iframe bridge; apps/web has no entry that builds it directly.
 */
export interface PolymarketShareWinningsParams {
    type: 'winnings';
    totalWon: number;
    items: PolymarketShareWinningsItem[];
    identity: PolymarketShareIdentity;
}

export type PolymarketShareImageParams = PolymarketSharePositionParams | PolymarketShareWinningsParams;
