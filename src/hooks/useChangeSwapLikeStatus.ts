import { useMutation } from '@tanstack/react-query';
import { produce } from 'immer';

import { queryClient } from '@/configs/queryClient.js';
import { Source, TxReactionType } from '@/constants/enum.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { patchTransactionsQuery } from '@/helpers/patchTransactionsQuery.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { createTxReaction } from '@/providers/firefly/endpoints/createTxReaction.js';
import { removeTxReaction } from '@/providers/firefly/endpoints/removeTxReaction.js';
import { captureSwapEvent } from '@/providers/telemetry/captureSwapEvent.js';
import type { SwapActivity } from '@/providers/types/Firefly.js';
import { EventId } from '@/providers/types/Telemetry.js';

function updateQueries(activity: SwapActivity) {
    queryClient.setQueriesData<{
        pages: Array<{ data: SwapActivity[] }>;
    }>(
        {
            queryKey: ['swaps'],
        },
        (old) => {
            if (!old) return old;

            return produce(old, (draft) => {
                draft.pages.forEach((page) => {
                    page.data.forEach((oldData) => {
                        if (oldData.hash === activity.hash) {
                            oldData.is_like = !activity.is_like;
                            oldData.like_count = oldData.like_count + (activity.is_like ? -1 : 1);
                        }
                    });
                });
            });
        },
    );

    patchTransactionsQuery(Source.Swap, (data) => {
        if (data.hash === activity.hash) {
            data.is_like = !activity.is_like;
            data.like_count = data.like_count + (activity.is_like ? -1 : 1);
        }
    });

    queryClient.setQueryData<SwapActivity>(['swap', activity.hash, activity.chain_id], (old) => {
        if (!old) return old;

        return produce(old, (draft) => {
            draft.is_like = !activity.is_like;
            draft.like_count = draft.like_count + (activity.is_like ? -1 : 1);
        });
    });
}

export function useChangeSwapLikeStatus(activity?: SwapActivity) {
    const isLoginFirefly = useIsLoginFirefly();

    return useMutation({
        mutationFn: async () => {
            if (!activity) return;
            if (!isLoginFirefly) {
                openLoginModal();
                return;
            }

            let result;
            if (activity.is_like) {
                result = await removeTxReaction(TxReactionType.LikeSwap, [activity.hash]);
            } else {
                result = await createTxReaction(
                    TxReactionType.LikeSwap,
                    activity.chain_id.toString(),
                    activity.hash,
                    activity.owner,
                );
            }

            if (result) {
                updateQueries(activity);

                if (!activity.is_like) captureSwapEvent(EventId.EVENT_LIKE_SWAP_CLICK);
            }
        },
    });
}
