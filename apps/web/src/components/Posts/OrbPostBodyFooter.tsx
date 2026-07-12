'use client';

import { PredictionPlatform } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';
import { memo, useMemo } from 'react';

import { Link } from '@/components/Link.js';
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

export interface OrbPostBodyFooterProps {
    post: Post;
}

/**
 * The Orb (LPT-1) position pill + sport/event card rendered between a post body
 * and its action bar — the same footer the World Cup feed (`OrbTimelineCell`)
 * attaches to its cells, extracted so the feed and the post-detail page render
 * identically and can't drift.
 *
 * The event slug is parsed from the post's own LPT-1 item tag and resolved
 * client-side via `useBetsEventBySlug` (no `PredictionContext` needed); the
 * position's market title + outcome label are resolved from that event. The pill
 * (`PositionBadge`) is null unless the post carries the LPT-1 position signal,
 * and this footer is null when no event/slug is present — so it is safe to
 * attach as the `bodyFooter` of any `SinglePost` (non-Orb posts render nothing).
 */
export const OrbPostBodyFooter = memo(function OrbPostBodyFooter({ post }: OrbPostBodyFooterProps) {
    const { eventSlug } = parseLpt1Tags(post.metadata.tags);
    const event = useBetsEventBySlug(eventSlug);

    const teams = useMemo<[SportTeam?, SportTeam?]>(
        () => [event?.sportData?.homeTeam, event?.sportData?.awayTeam],
        [event?.sportData?.homeTeam, event?.sportData?.awayTeam],
    );

    // Resolve the position's market title + outcome label from this post's own
    // event (the feed/detail page has no PredictionContext). Tag-encoded
    // positions carry no conditionId/outcome label, so the marketId →
    // outcomes[index].label path is what makes the pill show e.g.
    // [Team to Advance] [Argentina - $1].
    const { marketTitle, outcomeLabel } = useMemo(
        () => resolvePositionDisplayContext(post, event?.markets),
        [post, event?.markets],
    );

    // The author's position pill sits directly above the match card (FW-7899
    // Figma: market pill + colored option pill, e.g. [Team to Advance]
    // [ENG - $500]). The reused match card renders below it, inside the post
    // (above the action bar) so it reads as part of the comment. Prefer the
    // Figma sport card; fall back to the generic event card when the event isn't
    // a convertible sport game; a "View game" deep link is the last resort when
    // the slug is present but the event can't be resolved.
    const badge = <PositionBadge post={post} teams={teams} marketTitle={marketTitle} outcomeLabel={outcomeLabel} />;

    if (event) {
        const activity = betsEventDataToSportTimelineActivity(event);
        return (
            <div className="ml-[52px]">
                {badge}
                {activity ? <SportTimelineActivityCard activity={activity} /> : <PredictionEventCard event={event} />}
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
});
