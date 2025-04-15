import { t } from '@lingui/core/macro';
import { useMutation } from '@tanstack/react-query';
import { produce } from 'immer';

import { queryClient } from '@/configs/queryClient.js';
import { enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { captureSwapEvent } from '@/providers/telemetry/captureSwapEvent.js';
import type { SwapActivity } from '@/providers/types/Firefly.js';
import { EventId } from '@/providers/types/Telemetry.js';

export function useChangeSwapLikeStatus(activity?: SwapActivity) {
    return useMutation({
        mutationFn: async () => {
            if (!activity) return;
            let result;
            if (activity.is_like) {
                result = await FireflyEndpointProvider.likeRemove(activity.hash);
            } else {
                result = await FireflyEndpointProvider.likeCreate(
                    'swap',
                    activity.chain_id.toString(),
                    activity.hash,
                    activity.owner,
                );
            }

            if (result) {
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

                queryClient.setQueryData<SwapActivity>(['swap', activity.hash, activity.chain_id], (old) => {
                    if (!old) return old;

                    return produce(old, (draft) => {
                        draft.is_like = !activity.is_like;
                        draft.like_count = draft.like_count + (activity.is_like ? -1 : 1);
                    });
                });

                if (!activity.is_like) captureSwapEvent(EventId.EVENT_LIKE_SWAP_CLICK);

                enqueueSuccessMessage(activity.is_like ? t`Unliked.` : t`Liked this swap.`);
            }
        },
    });
}
