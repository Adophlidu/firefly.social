'use client';

import { PredictionPlatform } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { Link } from '@/components/Link.js';
import { OrbCommentCell } from '@/components/Posts/OrbCommentCell.js';
import { parseLpt1Tags } from '@/helpers/lpt1.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export interface OrbTimelineCellProps {
    post: Post;
}

/**
 * Home "World Cup" timeline variant of the Orb comment cell: the comment plus a
 * lightweight "View game" footer that deep-links back to the event detail page
 * (event slug parsed from the post's LPT-1 item tag).
 */
export const OrbTimelineCell = memo(function OrbTimelineCell({ post }: OrbTimelineCellProps) {
    const { eventSlug } = parseLpt1Tags(post.metadata.tags);

    return (
        <div className="flex flex-col gap-1 py-1">
            <OrbCommentCell post={post} />
            {eventSlug ? (
                <Link
                    className="ml-[52px] w-fit text-medium font-bold text-highlight"
                    href={RouteResolver.betsEventDetail(PredictionPlatform.Polymarket, eventSlug)}
                >
                    <Trans>View game</Trans>
                </Link>
            ) : null}
        </div>
    );
});
