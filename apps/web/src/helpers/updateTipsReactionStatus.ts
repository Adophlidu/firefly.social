import { NotificationType, Source, TxReactionType } from '@dimensiondev/enums';
import { produce } from 'immer';

import { queryClient } from '@/configs/queryClient.js';
import { patchNotificationQueryData } from '@/helpers/patchNotificationQueryData.js';
import type { TipsDetail } from '@/providers/types/Firefly.js';

export function updateTipsReactionStatus(
    txHash: string,
    type: TxReactionType.LikeTip | TxReactionType.ShareTip,
    status: boolean,
) {
    const keyToUpdate = type === TxReactionType.LikeTip ? 'has_liked' : 'has_reposted';

    queryClient.setQueryData<TipsDetail>(['tips', txHash, true], (old) => {
        if (!old) return old;

        return produce(old, (draft) => {
            draft[keyToUpdate] = status;
        });
    });
    patchNotificationQueryData(Source.Notifications, (notification) => {
        if (notification.type === NotificationType.Tips && notification.data.tx_hash === txHash) {
            notification.data[keyToUpdate] = status;
        }
    });
}
