'use client';

import { PredictionPlatform } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';
import { memo, useMemo } from 'react';

import { Link } from '@/components/Link.js';
import { OrbCommentCell } from '@/components/Posts/OrbCommentCell.js';
import { PredictionEventCard } from '@/components/Posts/PredictionEventCard.js';
import { parseLpt1Tags } from '@/helpers/lpt1.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { useBetsEventBySlug } from '@/hooks/prediction/useBetsEventBySlug.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export interface OrbTimelineCellProps {
    post: Post;
}

/**
 * Home "World Cup" timeline variant of the Orb comment cell: the comment with
 * the reused match card (`PredictionEventCard`) embedded in the post body,
 * above the action bar — so the card reads as part of the comment and
 * deep-links to the event detail page. The event slug is parsed from the post's
 * LPT-1 item tag and resolved client-side; when the slug is present but the
 * event can't be resolved (e.g. fetch failed) a "View game" text link is kept
 * as a fallback.
 */
export const OrbTimelineCell = memo(function OrbTimelineCell({ post }: OrbTimelineCellProps) {
    const { eventSlug } = parseLpt1Tags(post.metadata.tags);
    const event = useBetsEventBySlug(eventSlug);

    const teamColors = useMemo<[string | undefined, string | undefined]>(
        () => [event?.sportData?.homeTeam?.color, event?.sportData?.awayTeam?.color],
        [event?.sportData?.homeTeam?.color, event?.sportData?.awayTeam?.color],
    );

    // The reused match card, rendered inside the post (above the action bar) so
    // it reads as part of the comment. Falls back to a "View game" deep link
    // when the slug is present but the event can't be resolved (e.g. fetch failed).
    const bodyFooter = useMemo(() => {
        if (event) {
            return (
                <div className="ml-[52px]">
                    <PredictionEventCard event={event} />
                </div>
            );
        }
        if (eventSlug) {
            return (
                <Link
                    className="ml-[52px] w-fit text-medium font-bold text-highlight"
                    href={RouteResolver.betsEventDetail(PredictionPlatform.Polymarket, eventSlug)}
                >
                    <Trans>View game</Trans>
                </Link>
            );
        }
        return null;
    }, [event, eventSlug]);

    return (
        <div className="flex flex-col gap-1 py-1">
            <OrbCommentCell post={post} teamColors={teamColors} bodyFooter={bodyFooter} />
        </div>
    );
});
