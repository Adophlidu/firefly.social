import { TipsDetailViewType } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/workers-shared/helpers/unreachable.js';
import type { Context } from 'hono';

import { formatTipsAccount } from '@/metadata/src/transaction/formatTipsAccount.js';
import type { TipsDetail } from '@/metadata/src/transaction/types.js';

export function getMaintainAccountInfo(data: TipsDetail, view: TipsDetailViewType, c: Context) {
    switch (view) {
        case TipsDetailViewType.Sender:
        case TipsDetailViewType.Receiver: {
            const isReceiver = view === TipsDetailViewType.Receiver;

            const maintainAccount = isReceiver ? data.to_account : data.from_account;
            const maintainAddress = isReceiver ? data.to_address : data.from_address;
            const targetAccount = isReceiver ? data.from_account : data.to_account;
            const targetAddress = isReceiver ? data.from_address : data.to_address;

            return {
                maintainAccountInfo: formatTipsAccount(c, maintainAddress, maintainAccount),
                targetAccountInfo: formatTipsAccount(c, targetAddress, targetAccount),
            };
        }
        default:
            safeUnreachable(view);
            return null;
    }
}
