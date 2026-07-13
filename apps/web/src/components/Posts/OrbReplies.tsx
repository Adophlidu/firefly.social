'use client';

import { EMPTY_LIST } from '@dimensiondev/constants';
import { Source } from '@dimensiondev/enums';
import { createIndicator } from '@dimensiondev/utils';
import { Plural, Trans } from '@lingui/react/macro';
import { useInfiniteQuery } from '@tanstack/react-query';
import { memo, useState } from 'react';

import { OrbCommentCell } from '@/components/Posts/OrbCommentCell.js';
import { STALE_TIMES } from '@/constants/query.js';
import { resolveProviderOptions, resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { stopPropagation } from '@/helpers/stopEvent.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import type { SportTeam } from '@/types/prediction.js';

export interface OrbRepliesProps {
    /** The parent post whose Lens comments (replies) are rendered. */
    post: Post;
    /** Optional sport teams [home (index 0), away (index 1)] forwarded to each reply's PositionBadge. */
    teams?: [SportTeam?, SportTeam?];
}

const REPLIES_PAGE_INCREMENT = 10;

/**
 * A single level of replies under an Orb comment (FW-7875 — matches the Figma
 * hierarchy: one indented reply level only). Rendered as the comment cell's
 * footer, below the action bar and inside the cell border. Each reply hides its
 * comment action (Like / Tip / Share only) so no deeper nesting is possible.
 * The list starts collapsed behind a "View N replies" toggle and pages 10 at a
 * time via "Show more". Reply compose is left to the top-level comment cell.
 * Clicks are stopped from bubbling so toggling/expanding doesn't trigger the
 * parent comment's navigate-on-click.
 */
export const OrbReplies = memo(function OrbReplies({ post, teams }: OrbRepliesProps) {
    const [expanded, setExpanded] = useState(false);
    const [visibleCount, setVisibleCount] = useState(REPLIES_PAGE_INCREMENT);

    // Eagerly fetch the first page of replies. Lens's denormalized
    // `stats.comments` undercounts Orb reply threads — a post can carry real
    // replies while `stats.comments === 0` (verified against postReferences),
    // so the stat can't gate the "View N replies" toggle. The reply graph
    // (getCommentsById) is the only reliable existence/count signal here. One
    // cached request per comment; expanding later reuses the same cache.
    const queryResult = useInfiniteQuery({
        queryKey: ['posts', Source.Lens, 'orb-replies', post.postId],
        queryFn: async ({ pageParam }) => {
            const provider = resolveSocialMediaProvider(Source.Lens, resolveProviderOptions(Source.Lens, pageParam));
            return provider.getCommentsById(post.postId, createIndicator(undefined, pageParam));
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextIndicator?.id,
        select: (data) => data.pages.flatMap((x) => x.data),
        staleTime: STALE_TIMES.MINUTE_5,
    });

    const replies = queryResult.data ?? EMPTY_LIST;
    // `stats.comments` is the claimed total but unreliable for Orb threads;
    // `replies.length` is the verified floor (fetched first page). Take the max
    // so the toggle shows whenever replies exist and never under-displays a
    // count we've actually verified.
    const replyCount = Math.max(post.stats?.comments ?? 0, replies.length);

    if (!expanded) {
        if (replyCount <= 0) return null;
        return (
            <div className="ml-[52px] flex flex-col gap-2" onClick={stopPropagation}>
                <button
                    type="button"
                    className="w-fit text-medium font-bold text-highlight"
                    onClick={() => setExpanded(true)}
                >
                    <Plural value={replyCount} one="View # reply" other="View # replies" />
                </button>
            </div>
        );
    }

    const visible = replies.slice(0, visibleCount);
    const hasMore = visibleCount < replies.length || !!queryResult.hasNextPage;

    return (
        <div className="ml-[52px] flex flex-col gap-2 border-l border-line pl-3" onClick={stopPropagation}>
            {visible.map((reply) => (
                <OrbCommentCell key={reply.postId} post={reply} teams={teams} hideCommentAction />
            ))}

            <div className="flex items-center gap-4 pt-1 text-medium font-bold text-highlight">
                <button type="button" onClick={() => setExpanded(false)}>
                    <Trans>Hide</Trans>
                </button>
                {hasMore ? (
                    <button
                        type="button"
                        onClick={() => {
                            if (visibleCount < replies.length) setVisibleCount((c) => c + REPLIES_PAGE_INCREMENT);
                            else if (!queryResult.isFetchingNextPage) queryResult.fetchNextPage();
                        }}
                    >
                        <Trans>Show more</Trans>
                    </button>
                ) : null}
            </div>
        </div>
    );
});
