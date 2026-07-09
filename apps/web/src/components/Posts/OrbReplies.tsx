'use client';

import { EMPTY_LIST } from '@dimensiondev/constants';
import { Source } from '@dimensiondev/enums';
import { createIndicator } from '@dimensiondev/utils';
import { Plural, Trans } from '@lingui/react/macro';
import { useInfiniteQuery } from '@tanstack/react-query';
import { memo, useState } from 'react';

import { OrbCommentCell } from '@/components/Posts/OrbCommentCell.js';
import { resolveProviderOptions, resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export interface OrbRepliesProps {
    /** The parent post whose Lens comments (replies) are rendered. */
    post: Post;
    /** 1 = replies to an Orb comment (comment action enabled → allows level-2); 2 = leaf replies. */
    depth: 1 | 2;
    /** Optional sport team colors forwarded to each reply's PositionBadge. */
    teamColors?: [string | undefined, string | undefined];
}

const REPLIES_PAGE_INCREMENT = 10;

/**
 * Nested replies under an Orb comment, capped at two levels. Level-1 replies keep
 * their comment action (replying creates a level-2 reply); level-2 replies hide it
 * (no level-3). The list starts collapsed and expands with a "show 10 / load 10
 * more" pager. Reply compose is handled by each cell's own Comment action.
 */
export const OrbReplies = memo(function OrbReplies({ post, depth, teamColors }: OrbRepliesProps) {
    const [expanded, setExpanded] = useState(false);
    const [visibleCount, setVisibleCount] = useState(REPLIES_PAGE_INCREMENT);

    const queryResult = useInfiniteQuery({
        queryKey: ['posts', Source.Lens, 'orb-replies', post.postId, depth],
        queryFn: async ({ pageParam }) => {
            const provider = resolveSocialMediaProvider(Source.Lens, resolveProviderOptions(Source.Lens, pageParam));
            return provider.getCommentsById(post.postId, createIndicator(undefined, pageParam));
        },
        enabled: expanded,
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextIndicator?.id,
        select: (data) => data.pages.flatMap((x) => x.data),
    });

    const replies = queryResult.data ?? EMPTY_LIST;
    const declaredCount = post.stats?.comments ?? 0;

    if (!expanded) {
        if (declaredCount <= 0) return null;
        return (
            <div className="ml-[52px] flex flex-col gap-2">
                <button
                    type="button"
                    className="w-fit text-medium font-bold text-highlight"
                    onClick={() => setExpanded(true)}
                >
                    <Plural value={declaredCount} one="View # reply" other="View # replies" />
                </button>
            </div>
        );
    }

    const visible = replies.slice(0, visibleCount);
    const hasMore = visibleCount < replies.length || !!queryResult.hasNextPage;

    return (
        <div className="ml-[52px] flex flex-col gap-2 border-l border-line pl-3">
            {visible.map((reply) => (
                <div key={reply.postId} className="flex flex-col gap-1">
                    <OrbCommentCell post={reply} teamColors={teamColors} hideCommentAction={depth === 2} />
                    {depth === 1 && (reply.stats?.comments ?? 0) > 0 ? (
                        <OrbReplies post={reply} depth={2} teamColors={teamColors} />
                    ) : null}
                </div>
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
