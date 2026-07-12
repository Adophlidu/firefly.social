'use client';

import { memo } from 'react';

import { OrbCommentCell } from '@/components/Posts/OrbCommentCell.js';
import { OrbPostBodyFooter } from '@/components/Posts/OrbPostBodyFooter.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export interface OrbTimelineCellProps {
    post: Post;
    /** Feed list key — forwarded to SinglePost so the scroll position is saved on navigation. */
    listKey?: string;
    /** Feed index — forwarded to SinglePost so the scroll position is saved on navigation. */
    index?: number;
}

/**
 * Home "World Cup" timeline variant of the Orb comment cell: the comment with
 * the reused match card embedded in the post body, above the action bar — so the
 * card reads as part of the comment and deep-links to the event detail page. The
 * footer (position pill + sport/event card) is shared with the post-detail page
 * via `OrbPostBodyFooter`, so the two surfaces render identically.
 */
export const OrbTimelineCell = memo(function OrbTimelineCell({ post, listKey, index }: OrbTimelineCellProps) {
    return (
        <OrbCommentCell post={post} listKey={listKey} index={index} bodyFooter={<OrbPostBodyFooter post={post} />} />
    );
});
