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
import { STALE_TIMES } from '@/constants/query.js';
import { openOrbCommentCompose } from '@/controllers/openOrbCommentCompose.js';
import { mapPositionToLpt1Input, pickLargestPosition } from '@/helpers/prediction/predictPositionToLpt1.js';
import { getAccountMarketPositions } from '@/providers/firefly/prediction/getAccountMarketPositions.js';
import { getLensPostsByLpt1Item } from '@/providers/lens/getLensPostsByLpt1Item.js';
import { ensureInternalLensAccountCurrent } from '@/services/ensureInternalLensAccountCurrent.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';
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
    //
    // Wallet + position scoping mirror iOS (FW-7899): polymarket/account/position
    // is keyed off eventIds, and a sport event's positions often live on a CHILD
    // event — so we batch the parent id with sportData.childEventIds. Querying
    // conditionIds or the parent id alone returns [] even when the user holds a
    // position. All positions returned this way belong to the current match.
    const { currentProfileSession } = useFireflyProfileStore();
    const batchEventIds = useMemo(
        () => [event?.id, ...(event?.sportData?.childEventIds ?? [])].filter(Boolean) as string[],
        [event?.id, event?.sportData?.childEventIds],
    );
    // Distinct query key — the Positions tab still uses the conditionIds call.
    const { data: positionAccounts } = useQuery({
        queryKey: [
            Source.Prediction,
            'orb-comment-position-wallets',
            PredictionPlatform.Polymarket,
            batchEventIds.join(','),
            currentProfileSession?.profileId,
        ],
        enabled: !!currentProfileSession && batchEventIds.length > 0,
        queryFn: () => getAccountMarketPositions([], batchEventIds),
    });
    const proxyAddress = first(positionAccounts ?? [])?.proxy ?? '';
    const positionQuery = useQuery({
        queryKey: [Source.Prediction, 'orb-comment-user-position', eventSlug, proxyAddress],
        enabled: !!proxyAddress && batchEventIds.length > 0,
        queryFn: () =>
            getPredictionPositionList(PredictionPlatform.Polymarket, {
                address: proxyAddress,
                eventId: batchEventIds.join(','),
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
