'use client';

import MessagesIcon from '@dimensiondev/assets/messages.svg';
import { PredictionPlatform, ScrollListKey, Source } from '@dimensiondev/enums';
import { createIndicator } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery, useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { first } from 'lodash-es';
import { memo, useContext, useMemo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { ListInPage } from '@/components/ListInPage.js';
import { OrbCommentCell } from '@/components/Posts/OrbCommentCell.js';
import { OrbReplies } from '@/components/Posts/OrbReplies.js';
import { getPredictionPositionList } from '@/components/Prediction/getPredictionPositionList.js';
import { PredictionContext } from '@/components/Prediction/PredictionContext.js';
import { openOrbCommentCompose } from '@/controllers/openOrbCommentCompose.js';
import { STALE_TIMES } from '@/constants/query.js';
import { mapPositionToLpt1Input, pickLargestPosition } from '@/helpers/prediction/predictPositionToLpt1.js';
import { useAllProxyWallets } from '@/hooks/prediction/useAllProxyWallets.js';
import { getLensPostsByLpt1Item } from '@/providers/lens/getLensPostsByLpt1Item.js';
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

    // Pre-fetch the commenter's largest position in this event on mount (NOT on
    // click — click must stay instant) so it can be attached to the published
    // Orb comment (FW-7899). Non-suspense: the comments list below already
    // suspends, and a missing wallet must not block the tab. When the author
    // holds positions in several markets of the event, the largest holding wins.
    const { data: proxyWallets } = useAllProxyWallets();
    const proxyAddress = first(proxyWallets ?? []) ?? '';
    const positionQuery = useQuery({
        queryKey: [Source.Prediction, 'orb-comment-user-position', eventSlug, proxyAddress],
        enabled: !!proxyAddress && !!event?.id,
        queryFn: () =>
            getPredictionPositionList(PredictionPlatform.Polymarket, {
                address: proxyAddress,
                eventId: event?.id,
                isProxyAddress: true,
                positionType: 'current',
            }),
        staleTime: STALE_TIMES.MINUTE_5,
    });
    const lpt1Position = useMemo(() => {
        const largest = pickLargestPosition(positionQuery.data?.data ?? []);
        return largest ? mapPositionToLpt1Input(largest) : null;
    }, [positionQuery.data?.data]);

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
                onClick={() => openOrbCommentCompose({ eventSlug, position: lpt1Position ?? undefined })}
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
