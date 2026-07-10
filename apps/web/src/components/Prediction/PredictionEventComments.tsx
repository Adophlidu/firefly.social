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
import { getLensPostsByLpt1Item } from '@/providers/lens/getLensPostsByLpt1Item.js';

interface PredictionEventCommentsProps {
    eventSlug: string;
}

export const PredictionEventComments = memo<PredictionEventCommentsProps>(function PredictionEventComments({
    eventSlug,
}) {
    const { event } = useContext(PredictionContext);
    const teamColors = useMemo<[string | undefined, string | undefined]>(() => {
        const sportData = event?.sportData;
        return [sportData?.homeTeam?.color, sportData?.awayTeam?.color];
    }, [event?.sportData]);

    const listKey = `${ScrollListKey.Comment}:orb:${eventSlug}`;

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
                onClick={() => openOrbCommentCompose({ eventSlug })}
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
                            teamColors={teamColors}
                            listKey={listKey}
                            index={index}
                            footer={<OrbReplies post={post} teamColors={teamColors} />}
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
