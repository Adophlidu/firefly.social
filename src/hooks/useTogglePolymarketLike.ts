import { t } from '@lingui/core/macro';
import { useMutation } from '@tanstack/react-query';
import { produce } from 'immer';

import { queryClient } from '@/configs/queryClient.js';
import { TxReactionType } from '@/constants/enum.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { createTxReaction } from '@/providers/firefly/endpoint/createTxReaction.js';
import { removeTxReaction } from '@/providers/firefly/endpoint/removeTxReaction.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { PolymarketActivity } from '@/providers/types/Firefly.js';

interface TogglePolymarketLikeParams {
    activity: PolymarketActivity;
    isLiked: boolean;
    likeCount: number;
}

function updatePolymarketQueries(params: TogglePolymarketLikeParams) {
    const { activity, isLiked, likeCount } = params;

    queryClient.setQueriesData<{
        pages: Array<{ data: PolymarketActivity[] }>;
    }>(
        {
            queryKey: ['polymarket'],
        },
        (old) => {
            if (!old?.pages) return old;

            return produce(old, (draft) => {
                draft.pages.forEach((page) => {
                    page.data.forEach((oldData: PolymarketActivity) => {
                        if (oldData.transactionHash === activity.transactionHash) {
                            oldData.isLiked = !isLiked;
                            oldData.likeCount = likeCount + (isLiked ? -1 : 1);
                        }
                    });
                });
            });
        },
    );
}

export function useTogglePolymarketLike() {
    return useMutation({
        mutationFn: async (params: TogglePolymarketLikeParams) => {
            if (!fireflySessionHolder.session) {
                openLoginModal();
                return;
            }

            const { activity, isLiked } = params;
            try {
                if (isLiked) {
                    await removeTxReaction(TxReactionType.LikeBets, [activity.transactionHash]);
                    enqueueSuccessMessage(t`Polymarket unliked`);
                } else {
                    await createTxReaction(TxReactionType.LikeBets, '0', activity.transactionHash, activity.owner);
                    enqueueSuccessMessage(t`Polymarket liked`);
                }
                updatePolymarketQueries(params);
            } catch (error) {
                enqueueMessageFromError(
                    error,
                    isLiked ? t`Failed to unlike Polymarket.` : t`Failed to like Polymarket.`,
                );
                throw error;
            }
        },
    });
}
