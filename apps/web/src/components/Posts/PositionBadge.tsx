'use client';

import { memo } from 'react';

import { parseLpt1Tags, readLpt1Position, readLpt1PositionFromTags } from '@/helpers/lpt1.js';
import { resolveOutcomeTeam } from '@/helpers/prediction/sportScoreUtils.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import type { SportTeam } from '@/types/prediction.js';

export interface PositionBadgeProps {
    post: Post;
    /**
     * Optional sport teams [home (index 0), away (index 1)] used to resolve the
     * held side's team color. When the outcome label matches a team, the badge
     * uses that team's color; otherwise it falls back to the default
     * green (index 0) / magenta (index 1) by outcomeIndex.
     */
    teams?: [SportTeam?, SportTeam?];
    /**
     * Optional market title rendered as a gray pill before the outcome pill
     * (spec: market-name pill + colored Outcome). Resolved by the parent from
     * the event's markets; omitted on surfaces without event context (e.g. the
     * World Cup feed).
     */
    marketTitle?: string;
    /**
     * Optional outcome label resolved from the market's outcomes, used when the
     * position carries no label of its own — i.e. tag-encoded positions
     * (`lpt1/item/outcome/<index>`), which only store the 0/1 index. Lets the
     * pill show the real option ("Argentina", "ENG", …) instead of a bare
     * Yes/No, and drives team-color resolution.
     */
    outcomeLabel?: string;
}

/**
 * `$value` = cost basis = shares × avg entry price, formatted as a whole-dollar
 * en-US string (e.g. `$5,000`). Hardcoded `en-US` so a Lingui locale never
 * renders `$5.000`; routed inline rather than through `helpers/formatCurrency`
 * (which adds decimals/boundary logic that breaks the `$5,000` spec).
 */
function formatUsdNoDecimals(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(Math.round(value));
}

/**
 * Renders the author's Polymarket position as two Figma-fidelity pills, read
 * from the post's LPT-1 tags + attributes: an optional gray market-title pill +
 * a colored `{outcome} − ${cost}` pill (cost = shares × entry price). Returns
 * null when the post carries no position.
 */
export const PositionBadge = memo(function PositionBadge({
    post,
    teams,
    marketTitle,
    outcomeLabel,
}: PositionBadgeProps) {
    const parsed = parseLpt1Tags(post.metadata.tags);
    if (!parsed.hasPosition) return null;

    const position = readLpt1Position(post.metadata.attributes) ?? readLpt1PositionFromTags(post.metadata.tags);
    if (!position) return null;

    const isYesSide = position.outcomeIndex === 0;
    // Prefer the position's own label, then the market-resolved label (tag-
    // encoded positions have none), then a bare Yes/No fallback.
    const outcome = position.outcome || outcomeLabel || (isYesSide ? 'Yes' : 'No');

    // A binary Yes/No market whose title IS the bet target (e.g. "Draw",
    // "Argentina") collapses to a single pill "Argentina - $1" — the subject is
    // the meaningful selection and a bare Yes/No would be redundant. But a Yes/No
    // QUESTION market (title ends with "?", e.g. "Will the Match Go to a Penalty
    // Shootout?") makes the answer the selection, so keep two pills and show the
    // Yes/No explicitly. Descriptive outcomes (ENG, Over/Under) always use two pills.
    const isBinaryOutcome = outcome === 'Yes' || outcome === 'No';
    const isQuestionMarket = isBinaryOutcome && !!marketTitle && marketTitle.trim().endsWith('?');
    const collapseToMarket = isBinaryOutcome && !!marketTitle && !isQuestionMarket;
    const displayOutcome = collapseToMarket ? marketTitle : outcome;

    // Resolve the held side's team color from the displayed selection; fall back
    // to the default green (Yes/home) / magenta (No/away) shades by outcomeIndex
    // when it isn't a team (Draw, O/U, or the team has no color).
    const team = resolveOutcomeTeam(displayOutcome, teams?.[0], teams?.[1]);
    const teamColor = team?.color;
    const color = teamColor ?? (isYesSide ? '#3dc233' : '#d23d7b');
    const backgroundColor = teamColor ? `${teamColor}1a` : isYesSide ? 'rgba(61,194,51,0.1)' : 'rgba(210,61,123,0.12)';

    return (
        <span className="mb-1 mr-auto inline-flex max-w-full items-center gap-1">
            {marketTitle && !collapseToMarket ? (
                <span
                    className="inline-flex h-6 min-w-0 items-center truncate rounded-[8px] px-2 text-sm font-semibold"
                    style={{ color: '#181818', backgroundColor: '#f5f5f9' }}
                >
                    {marketTitle}
                </span>
            ) : null}
            <span
                className="inline-flex h-6 shrink-0 items-center rounded-[8px] px-2 text-sm font-medium"
                style={{ color, backgroundColor }}
            >
                {displayOutcome} - {formatUsdNoDecimals(position.shares * position.price)}
            </span>
        </span>
    );
});
