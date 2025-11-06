import { useMutation } from '@tanstack/react-query';

import { TxReactionType } from '@/constants/enum.js';
import { updateTipsReactionStatus } from '@/helpers/updateTipsReactionStatus.js';
import { createTxReaction } from '@/providers/firefly/endpoint/createTxReaction.js';
import { removeTxReaction } from '@/providers/firefly/endpoint/removeTxReaction.js';

interface Options {
    txHash: string;
    chainId: number;
    liked: boolean;
    fromAddress: string;
}

export function useToggleTipLikeStatus({ txHash, chainId, liked, fromAddress }: Options) {
    return useMutation({
        mutationKey: ['toggleTipLikeStatus', chainId, txHash],
        mutationFn: async () => {
            let result;
            if (liked) {
                result = await removeTxReaction(TxReactionType.LikeTip, [txHash]);
            } else {
                result = await createTxReaction(TxReactionType.LikeTip, chainId.toString(), txHash, fromAddress);
            }
            if (result) {
                updateTipsReactionStatus(txHash, TxReactionType.LikeTip, !liked);
            }
        },
    });
}
