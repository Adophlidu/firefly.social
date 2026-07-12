'use client';

import { PredictionPlatform } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';
import { memo, useMemo } from 'react';

import { Link } from '@/components/Link.js';
import { OrbCommentCell } from '@/components/Posts/OrbCommentCell.js';
import { PositionBadge } from '@/components/Posts/PositionBadge.js';
import { PredictionEventCard } from '@/components/Posts/PredictionEventCard.js';
import { SportTimelineActivityCard } from '@/components/Prediction/Sport/SportTimelineActivityCard.js';
import { parseLpt1Tags } from '@/helpers/lpt1.js';
import { betsEventDataToSportTimelineActivity } from '@/helpers/prediction/betsEventDataToSportTimelineActivity.js';
import { resolvePositionDisplayContext } from '@/helpers/prediction/lpt1PositionDisplay.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { useBetsEventBySlug } from '@/hooks/prediction/useBetsEventBySlug.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import type { SportTeam } from '@/types/prediction.js';

export interface OrbTimelineCellProps {
    post: Post;
}

/**
 * Home "World Cup" timeline variant of the Orb comment cell: the comment with
 * the reused match card embedded in the post body, above the action bar — so the
 * card reads as part of the comment and deep-links to the event detail page. The
 * event slug is parsed from the post's LPT-1 item tag and resolved client-side,
 * then rendered as the Figma `SportTimelineActivityCard` when it converts, else
 * the generic `PredictionEventCard`; a "View game" text link is the last-resort
 * fallback when the slug is present but the event can't be resolved.
 */
export const OrbTimelineCell = memo(function OrbTimelineCell({ post }: OrbTimelineCellProps) {
    const { eventSlug } = parseLpt1Tags(post.metadata.tags);
    const event = useBetsEventBySlug(eventSlug);

    const teams = useMemo<[SportTeam?, SportTeam?]>(
        () => [event?.sportData?.homeTeam, event?.sportData?.awayTeam],
        [event?.sportData?.homeTeam, event?.sportData?.awayTeam],
    );

    // Resolve the position's market title + outcome label from this cell's own
    // event (the feed has no PredictionContext). Tag-encoded positions carry no
    // conditionId/outcome label, so the marketId → outcomes[index].label path is
    // what makes the pill show e.g. [Team to Advance] [Argentina - $1].
    const { marketTitle, outcomeLabel } = useMemo(
        () => resolvePositionDisplayContext(post, event?.markets),
        [post, event?.markets],
    );

    // The author's position pill sits directly above the match card (FW-7899
    // Figma: market pill + colored option pill, e.g. [Team to Advance] [ENG - $500]).
    // The reused match card renders below it, inside the post (above the action
    // bar) so it reads as part of the comment. Prefer the Figma sport card; fall
    // back to the generic event card when the event isn't a convertible sport
    // game; a "View game" deep link is the last resort when the slug is present
    // but the event can't be resolved.
    const bodyFooter = useMemo(() => {
        const badge = <PositionBadge post={post} teams={teams} marketTitle={marketTitle} outcomeLabel={outcomeLabel} />;
        if (event) {
            const activity = betsEventDataToSportTimelineActivity(event);
            return (
                <div className="ml-[52px]">
                    {badge}
                    {activity ? (
                        <SportTimelineActivityCard activity={activity} />
                    ) : (
                        <PredictionEventCard event={event} />
                    )}
                </div>
            );
        }
        if (eventSlug) {
            return (
                <div className="ml-[52px]">
                    {badge}
                    <Link
                        className="w-fit text-medium font-bold text-highlight"
                        href={RouteResolver.betsEventDetail(PredictionPlatform.Polymarket, eventSlug)}
                    >
                        <Trans>View game</Trans>
                    </Link>
                </div>
            );
        }
        return null;
    }, [event, eventSlug, post, teams, marketTitle, outcomeLabel]);

    return (
        <div className="flex flex-col gap-1 py-1">
            <OrbCommentCell post={post} teams={teams} bodyFooter={bodyFooter} />
        </div>
    );
});
