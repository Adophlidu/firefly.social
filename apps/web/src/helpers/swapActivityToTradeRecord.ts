import { Source } from '@dimensiondev/enums';
import { isSameAddress } from '@dimensiondev/web3/utils';

import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { getWalletProfileAvatar } from '@/helpers/getWalletProfileAvatar.js';
import type { SwapActivity } from '@/providers/types/Firefly.js';
import type { TradeRecord } from '@/types/token.js';

export function swapActivityToTradeRecord(activity: SwapActivity, tokenAddress: string): TradeRecord | null {
    const isSell = isSameAddress(activity.from_token?.address, tokenAddress);
    const token = isSell ? activity.from_token : activity.to_token;
    if (!token) return null;
    return {
        chainId: activity.chain_id,
        hash: activity.hash,
        user: {
            name: activity.displayInfo?.ensHandle ?? undefined,
            avatar:
                getWalletProfileAvatar(activity.displayInfo) ||
                getStampAvatarByProfileId(Source.Wallet, activity.owner),
        },
        amount: token.amount_str,
        uiAmount: token.amount_num,
        decimals: token.decimal,
        date: +activity.timestamp * 1000,
        value: token.price ? +token.price : 0,
        type: isSell ? 'sell' : 'buy',
    };
}
