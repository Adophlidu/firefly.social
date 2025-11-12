import { t } from '@lingui/core/macro';
import { useMutation } from '@tanstack/react-query';
import { produce } from 'immer';

import { queryClient } from '@/configs/queryClient.js';
import { PlatformId, TxReactionType } from '@/constants/enum.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { createTxReaction } from '@/providers/firefly/endpoint/createTxReaction.js';
import { removeTxReaction } from '@/providers/firefly/endpoint/removeTxReaction.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { SnapshotActivity } from '@/providers/snapshot/type.js';

interface ToggleSnapshotLikeParams {
    activity: SnapshotActivity;
    isLiked: boolean;
    likeCount: number;
}

function updateSnapshotQueries(params: ToggleSnapshotLikeParams) {
    const { activity, isLiked } = params;

    queryClient.setQueriesData<{
        pages: Array<{ data: any[] }>;
    }>(
        {
            queryKey: ['activities'],
        },
        (old) => {
            if (!old) return old;

            return produce(old, (draft) => {
                draft.pages.forEach((page) => {
                    page.data.forEach((item: any) => {
                        if (item.source === 'DAOs' && item.data?.hash === activity.hash) {
                            item.data.isLiked = !isLiked;
                            item.data.likeCount = (item.data.likeCount || 0) + (isLiked ? -1 : 1);
                        }
                    });
                });
            });
        },
    );

    queryClient.setQueriesData<{
        pages: Array<{ data: SnapshotActivity[] }>;
    }>(
        {
            queryKey: ['snapshots'],
        },
        (old) => {
            if (!old) return old;

            return produce(old, (draft) => {
                draft.pages.forEach((page) => {
                    page.data.forEach((oldData: SnapshotActivity) => {
                        if (oldData.hash === activity.hash) {
                            oldData.isLiked = !isLiked;
                            oldData.likeCount = (oldData.likeCount || 0) + (isLiked ? -1 : 1);
                        }
                    });
                });
            });
        },
    );
}

export function useToggleSnapshotLike() {
    return useMutation({
        mutationFn: async (params: ToggleSnapshotLikeParams) => {
            if (!fireflySessionHolder.session) {
                openLoginModal();
                return;
            }

            const { activity, isLiked } = params;
            try {
                if (isLiked) {
                    await removeTxReaction(TxReactionType.LikeDAO, [activity.hash]);
                    enqueueSuccessMessage(t`Snapshot unliked`);
                } else {
                    await createTxReaction(
                        TxReactionType.LikeDAO,
                        PlatformId.Others.toString(),
                        activity.hash,
                        activity.owner,
                    );
                    enqueueSuccessMessage(t`Snapshot liked`);
                }
                updateSnapshotQueries(params);
            } catch (error) {
                enqueueMessageFromError(error, isLiked ? t`Failed to unlike snapshot.` : t`Failed to like snapshot.`);
                throw error;
            }
        },
    });
}
