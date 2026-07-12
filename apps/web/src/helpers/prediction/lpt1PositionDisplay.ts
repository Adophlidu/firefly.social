import { type Lpt1PositionOutput, readLpt1Position, readLpt1PositionFromTags } from '@/helpers/lpt1.js';
import type { Post } from '@/providers/types/SocialMedia.js';

/**
 * Resolved display context for an Orb comment's position pill: the market title
 * (gray pill) and the selected outcome label (so the colored pill shows the
 * real option, e.g. "Argentina" or "ENG", instead of a bare Yes/No).
 */
export interface PositionDisplayContext {
    marketTitle?: string;
    outcomeLabel?: string;
}

/** Minimal market shape needed to resolve a position's display context. */
interface PositionMarketLike {
    id: string;
    conditionId: string;
    title: string;
    /** Short team/leg label (e.g. "Argentina"); preferred over `title` for the pill. */
    groupItemTitle?: string;
    outcomes: Array<{ label?: string }>;
    /** 2-way legs merged into a 3-way moneyline — also searched by id/conditionId. */
    originalMoneylineMarkets?: PositionMarketLike[];
}

/**
 * Short market label for the pill: prefer `groupItemTitle`, else `title` with a
 * trailing "(Home vs. Away)" qualifier stripped — e.g. "Draw (Argentina vs.
 * Switzerland)" → "Draw". Falls back to the raw title when nothing is left.
 */
function shortMarketTitle(market: PositionMarketLike): string {
    const raw = market.groupItemTitle || market.title;
    return raw.replace(/\s*\([^)]*\)\s*$/, '').trim() || raw;
}

/**
 * Resolve the market title + outcome label for an LPT-1 position from an
 * event's markets. Looks up by `conditionId` (primary) then `marketId`
 * (fallback for tag-encoded positions, which carry no `conditionId`), searching
 * both top-level markets and the 2-way legs nested under each merged moneyline's
 * `originalMoneylineMarkets` — a tag-encoded position often carries a leg's
 * marketId, which is not a top-level entry. Either field is undefined when the
 * position's market isn't in the event; callers fall back to a bare Yes/No.
 */
export function resolvePositionMarketContext(
    position: Lpt1PositionOutput,
    markets: PositionMarketLike[] | undefined,
): PositionDisplayContext {
    if (!markets?.length) return {};
    const flat = markets.flatMap((m) => [m, ...(m.originalMoneylineMarkets ?? [])]);
    const market =
        (position.conditionId ? flat.find((m) => m.conditionId === position.conditionId) : undefined) ??
        (position.marketId ? flat.find((m) => m.id === position.marketId) : undefined);
    if (!market) return {};
    return {
        marketTitle: shortMarketTitle(market),
        outcomeLabel: market.outcomes[position.outcomeIndex]?.label,
    };
}

/**
 * Read the position off a post (attributes, then the tag fallback) and resolve
 * its market title + outcome label. Returns empty context for a post with no
 * position, or whose market isn't resolvable (e.g. the World Cup feed before
 * the event loads, or a market id absent from the event).
 */
export function resolvePositionDisplayContext(
    post: Post,
    markets: PositionMarketLike[] | undefined,
): PositionDisplayContext {
    const position = readLpt1Position(post.metadata.attributes) ?? readLpt1PositionFromTags(post.metadata.tags);
    if (!position) return {};
    return resolvePositionMarketContext(position, markets);
}
