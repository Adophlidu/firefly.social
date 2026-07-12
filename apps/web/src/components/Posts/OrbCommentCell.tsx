'use client';

import { memo, type ReactNode, useContext, useMemo } from 'react';

import type { PostActionsMask } from '@/components/Actions/PostActions.js';
import { PositionBadge } from '@/components/Posts/PositionBadge.js';
import { SinglePost } from '@/components/Posts/SinglePost.js';
import { PredictionContext } from '@/components/Prediction/PredictionContext.js';
import { buildOrbComposePayload, type Lpt1PositionInput } from '@/helpers/lpt1.js';
import { resolvePositionDisplayContext } from '@/helpers/prediction/lpt1PositionDisplay.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import type { SportTeam } from '@/types/prediction.js';

export interface OrbCommentCellProps {
    post: Post;
    /** Optional sport teams [home (index 0), away (index 1)] for the position badge. */
    teams?: [SportTeam?, SportTeam?];
    /** Drop the comment action (used for replies, which have no deeper nesting). */
    hideCommentAction?: boolean;
    /** Feed list key — forwarded to SinglePost so the scroll position is saved on navigation. */
    listKey?: string;
    /** Feed index — forwarded to SinglePost so the scroll position is saved on navigation. */
    index?: number;
    /** Extra content rendered between the comment body and the action bar (e.g. the match card). */
    bodyFooter?: ReactNode;
    /** Extra content rendered below the action bar, at the bottom of the cell (e.g. the replies toggle). */
    footer?: ReactNode;
    /**
     * Event slug for the reply compose path. When this cell exposes a reply action
     * (`!hideCommentAction`) and an `eventSlug` is given, the reply carries the
     * replier's own LPT-1 position (same as a root Orb comment) so its position
     * pill renders. Omit on feed cells / replies (`hideCommentAction`) — those keep
     * the default position-less reply composer.
     */
    eventSlug?: string;
    /** The replier's own position in the event, pre-fetched by the page (largest holding). */
    position?: Lpt1PositionInput | null;
}

/**
 * A stripped-down Lens post cell for Orb (LPT-1) comments: no @handle, no more
 * menu, no non-Firefly source icon, only Comment / Like (with count) / Tips /
 * Share actions, plus an optional PositionBadge.
 *
 * The badge renders inside the post body, just above the action bar. It
 * resolves its market title + outcome label from the PredictionContext event
 * (event-detail Comments tab). On the World Cup feed the parent
 * (`OrbTimelineCell`) resolves them from its own event and supplies its own
 * `bodyFooter` (badge + match card), which takes precedence so the badge isn't
 * duplicated.
 */
export const OrbCommentCell = memo(function OrbCommentCell({
    post,
    teams,
    hideCommentAction = false,
    listKey,
    index,
    bodyFooter,
    footer,
    eventSlug,
    position,
}: OrbCommentCellProps) {
    const { event } = useContext(PredictionContext);
    const { marketTitle, outcomeLabel } = useMemo(
        () => resolvePositionDisplayContext(post, event?.markets),
        [post, event?.markets],
    );

    const actionsMask: PostActionsMask = {
        mirror: true,
        collect: true,
        bookmark: true,
        comment: hideCommentAction,
        statistics: true,
    };

    // Only the top-level Orb comment cell (reply action visible) on the event
    // detail page threads the replier's LPT-1 position onto its replies. Reply
    // cells (`hideCommentAction`) and feed cells (no `eventSlug`) stay default.
    // `scope: 'reply'` emits the position block only (no event/worldcup
    // discovery tags) so the reply nests under its parent via OrbReplies instead
    // of surfacing as a standalone root post in the event/World Cup feeds.
    const commentComposeOptions = useMemo(
        () =>
            !hideCommentAction && eventSlug
                ? { ...buildOrbComposePayload({ eventSlug, position, scope: 'reply' }), lockThread: true }
                : undefined,
        [hideCommentAction, eventSlug, position],
    );

    return (
        <SinglePost
            post={post}
            // Replies are Lens Comments whose `commentOn` is the top-level Orb comment.
            // Render them as comments so SinglePost skips FeedActionType — otherwise
            // PostParent re-renders the parent as a thread above each reply (FW-7875).
            isComment={hideCommentAction}
            hideHeaderHandle
            hideMoreMenu
            hideNonFireflySourceIcon
            showLikeCount
            actionsMask={actionsMask}
            commentComposeOptions={commentComposeOptions}
            listKey={listKey}
            index={index}
            bodyFooter={
                bodyFooter ?? (
                    <div className="ml-[52px]">
                        <PositionBadge
                            post={post}
                            teams={teams}
                            marketTitle={marketTitle}
                            outcomeLabel={outcomeLabel}
                        />
                    </div>
                )
            }
            footer={footer}
        />
    );
});
