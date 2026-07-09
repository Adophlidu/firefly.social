'use client';

import { memo, useContext, useMemo } from 'react';

import type { PostActionsMask } from '@/components/Actions/PostActions.js';
import { PositionBadge } from '@/components/Posts/PositionBadge.js';
import { SinglePost } from '@/components/Posts/SinglePost.js';
import { PredictionContext } from '@/components/Prediction/PredictionContext.js';
import { readLpt1Position } from '@/helpers/lpt1.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export interface OrbCommentCellProps {
    post: Post;
    /** Optional sport team colors [home (index 0), away (index 1)] for the position badge. */
    teamColors?: [string | undefined, string | undefined];
    /** Drop the comment action (used for level-2 replies to prevent a level-3). */
    hideCommentAction?: boolean;
}

/**
 * Resolve a market title for the post's LPT-1 position from the in-memory event
 * (no network call). The position's `conditionId` is the primary lookup key; the
 * optional `marketId` is a fallback. Returns undefined when there is no event
 * context (e.g. the World Cup feed) or the position's market isn't in the event.
 */
function resolveMarketTitle(
    markets: Array<{ conditionId: string; id: string; title: string }> | undefined,
    post: Post,
): string | undefined {
    if (!markets?.length) return undefined;
    const position = readLpt1Position(post.metadata.attributes);
    if (!position) return undefined;
    return (
        markets.find((m) => m.conditionId === position.conditionId)?.title ??
        (position.marketId ? markets.find((m) => m.id === position.marketId)?.title : undefined)
    );
}

/**
 * A stripped-down Lens post cell for Orb (LPT-1) comments: no @handle, no more
 * menu, no non-Firefly source icon, only Comment / Like (with count) / Tips /
 * Share actions, plus an optional PositionBadge in the header slot.
 */
export const OrbCommentCell = memo(function OrbCommentCell({
    post,
    teamColors,
    hideCommentAction = false,
}: OrbCommentCellProps) {
    const { event } = useContext(PredictionContext);
    const marketTitle = useMemo(() => resolveMarketTitle(event?.markets, post), [event?.markets, post]);

    const actionsMask: PostActionsMask = {
        mirror: true,
        collect: true,
        bookmark: true,
        comment: hideCommentAction,
    };

    return (
        <SinglePost
            post={post}
            hideHeaderHandle
            hideMoreMenu
            hideNonFireflySourceIcon
            showLikeCount
            actionsMask={actionsMask}
            header={<PositionBadge post={post} teamColors={teamColors} marketTitle={marketTitle} />}
        />
    );
});
