'use client';

import MessagesIcon from '@dimensiondev/assets/messages.svg';
import { ScrollListKey, Source } from '@dimensiondev/enums';
import { createIndicator } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { memo, useContext, useMemo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { ListInPage } from '@/components/ListInPage.js';
import { OrbCommentCell } from '@/components/Posts/OrbCommentCell.js';
import { OrbReplies } from '@/components/Posts/OrbReplies.js';
import { PredictionContext } from '@/components/Prediction/PredictionContext.js';
import { openOrbCommentCompose } from '@/controllers/openOrbCommentCompose.js';
import { useOrbReplyPosition } from '@/hooks/prediction/useOrbReplyPosition.js';
import { getLensPostsByLpt1Item } from '@/providers/lens/getLensPostsByLpt1Item.js';
import { ensureInternalLensAccountCurrent } from '@/services/ensureInternalLensAccountCurrent.js';
import type { SportTeam } from '@/types/prediction.js';

interface PredictionEventCommentsProps {
    eventSlug: string;
}

export const PredictionEventComments = memo<PredictionEventCommentsProps>(function PredictionEventComments({
    eventSlug,
}) {
    const { event } = useContext(PredictionContext);
    const teams = useMemo<[SportTeam?, SportTeam?]>(
        () => [event?.sportData?.homeTeam, event?.sportData?.awayTeam],
        [event?.sportData?.homeTeam, event?.sportData?.awayTeam],
    );

    const listKey = `${ScrollListKey.Comment}:orb:${eventSlug}`;

    // Pre-fetch the commenter's largest position in this event (NOT on click —
    // click must stay instant) so it can be attached to the published Orb comment.
    // Shared with the post-detail page via `useOrbReplyPosition`,
    // which also keeps the position fresh right after a trade via the wallet
    // `position-operation` event (stale-cache fix).
    const lpt1Position = useOrbReplyPosition({ eventSlug, event });

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['posts', Source.Lens, 'orb-comments', eventSlug],
        queryFn: ({ pageParam }) => getLensPostsByLpt1Item(eventSlug, createIndicator(undefined, pageParam)),
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextIndicator?.id,
        select: (data) => data.pages.flatMap((x) => x.data),
    });

    return (
        <div className="px-4 pt-4">
            <ClickableButton
                className="mb-3 flex h-10 w-full items-center rounded-2xl border border-line bg-primaryBottom px-4 text-left text-medium text-second"
                onClick={async () => {
                    // Default the author to the managed ff-<uid> Lens account (FW-7902) before
                    // opening the compose so the picker shows it as the selected author.
                    await ensureInternalLensAccountCurrent();
                    openOrbCommentCompose({ eventSlug, position: lpt1Position ?? undefined });
                }}
            >
                <Trans>Add a comment</Trans>
            </ClickableButton>

            <ListInPage
                source={Source.Lens}
                queryResult={queryResult}
                VirtualListProps={{
                    listKey,
                    computeItemKey: (index, post) => `${post.postId}-${index}`,
                    // eslint-disable-next-line react/no-unstable-nested-components -- render prop, not a component
                    itemContent: (index, post) => (
                        <OrbCommentCell
                            key={post.postId}
                            post={post}
                            teams={teams}
                            listKey={listKey}
                            index={index}
                            // Thread the replier's own LPT-1 position onto replies opened from
                            // this top-level Orb comment so the reply renders a position pill too.
                            eventSlug={eventSlug}
                            position={lpt1Position}
                            footer={<OrbReplies post={post} teams={teams} />}
                        />
                    ),
                }}
                NoResultsFallbackProps={{
                    icon: <MessagesIcon width={24} height={24} />,
                    message: <Trans>Be the first one to comment!</Trans>,
                }}
            />
        </div>
    );
});
