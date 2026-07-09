'use client';

import { classNames } from '@dimensiondev/utils';
import { memo } from 'react';

import { parseLpt1Tags, readLpt1Position } from '@/helpers/lpt1.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export interface PositionBadgeProps {
    post: Post;
    /**
     * Optional sport team colors used to tint the badge: index 0 = home, index 1 = away.
     * When omitted (or the index has no color), the badge defaults to green (Yes/home) / red (No/away).
     */
    teamColors?: [string | undefined, string | undefined];
    /**
     * Optional market title rendered before the outcome pill (spec B.5: market
     * name + green/red Outcome). Resolved by the parent from the event's markets;
     * omitted on surfaces without event context (e.g. the World Cup feed).
     */
    marketTitle?: string;
}

function formatShares(n: number): string {
    return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/**
 * Renders the author's Polymarket position as a colored pill, read from the
 * post's LPT-1 tags + attributes. Returns null when the post carries no position.
 * When `marketTitle` is provided it is shown before the outcome pill.
 */
export const PositionBadge = memo(function PositionBadge({ post, teamColors, marketTitle }: PositionBadgeProps) {
    const parsed = parseLpt1Tags(post.metadata.tags);
    if (!parsed.hasPosition) return null;

    const position = readLpt1Position(post.metadata.attributes);
    if (!position) return null;

    const isYesSide = position.outcomeIndex === 0;
    const teamColor = teamColors?.[position.outcomeIndex];
    const outcome = position.outcome || (isYesSide ? 'Yes' : 'No');
    const pricePct = Math.round(position.price * 100);

    return (
        <span className="mb-1 mr-auto inline-flex max-w-full items-center gap-1">
            {marketTitle ? (
                <span className="min-w-0 truncate text-xs font-medium text-second">{marketTitle}</span>
            ) : null}
            <span
                className={classNames(
                    'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-bold',
                    teamColor ? '' : isYesSide ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
                )}
                style={teamColor ? { color: teamColor, backgroundColor: `${teamColor}1a` } : undefined}
            >
                {outcome} · {formatShares(position.shares)} @ {pricePct}%
            </span>
        </span>
    );
});
