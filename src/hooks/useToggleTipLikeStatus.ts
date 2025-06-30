import { useMutation } from '@tanstack/react-query';
import { produce } from 'immer';

import { queryClient } from '@/configs/queryClient.js';
import { LikeRecordType, Source } from '@/constants/enum.js';
import { patchNotificationQueryData } from '@/helpers/patchNotificationQueryData.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { TipsDetail } from '@/providers/types/Firefly.js';
import { NotificationType } from '@/providers/types/SocialMedia.js';

interface Options {
    txHash: string;
    chainId: number;
    liked: boolean;
    fromAddress: string;
}

function updateQueries(txHash: string, liked: boolean) {
    queryClient.setQueryData<TipsDetail>(['tips', txHash, true], (old) => {
        if (!old) return old;

        return produce(old, (draft) => {
            draft.has_liked = liked;
        });
    });
    patchNotificationQueryData(Source.Notifications, (notification) => {
        if (notification.type === NotificationType.Tips && notification.data.tx_hash === txHash) {
            notification.data.has_liked = liked;
        }
    });
}

export function useToggleTipLikeStatus({ txHash, chainId, liked, fromAddress }: Options) {
    return useMutation({
        mutationKey: ['toggleTipLikeStatus', chainId, txHash],
        mutationFn: async () => {
            let result;
            if (liked) {
                result = await FireflyEndpointProvider.likeRemove(txHash);
            } else {
                result = await FireflyEndpointProvider.likeCreate(
                    LikeRecordType.Tips,
                    chainId.toString(),
                    txHash,
                    fromAddress,
                );
            }
            if (result) {
                updateQueries(txHash, !liked);
            }
        },
    });
}
