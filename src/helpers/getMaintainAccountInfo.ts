import { safeUnreachable } from '@firefly/utils';

import { Source, TipsDetailViewType } from '@/constants/enum.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import type { TipsAccountInfo, TipsDetail as TipsDetailType } from '@/providers/types/Firefly.js';

function formatTipsAccount(address: string, accountInfo?: TipsAccountInfo) {
    const avatar =
        accountInfo?.firefly_avatar ||
        (accountInfo?.firefly_uuid
            ? getStampAvatarByProfileId(Source.Firefly, accountInfo.firefly_uuid)
            : getStampAvatarByProfileId(Source.Wallet, address));
    const displayName = accountInfo?.firefly_name || formatAddress(address, 4, 2, false);

    return {
        avatar,
        address,
        displayName,
        link: RouteResolver.profile({
            source: accountInfo?.firefly_uid ? Source.Firefly : Source.Wallet,
            profileId: accountInfo?.firefly_uid || address,
        }),
    };
}

export function getMaintainAccountInfo(data: TipsDetailType, view: TipsDetailViewType) {
    switch (view) {
        case TipsDetailViewType.Sender:
        case TipsDetailViewType.Receiver: {
            const isReceiver = view === TipsDetailViewType.Receiver;

            const maintainAccount = isReceiver ? data.to_account : data.from_account;
            const maintainAddress = isReceiver ? data.to_address : data.from_address;
            const targetAccount = isReceiver ? data.from_account : data.to_account;
            const targetAddress = isReceiver ? data.from_address : data.to_address;

            return {
                maintainAccountInfo: formatTipsAccount(maintainAddress, maintainAccount),
                targetAccountInfo: formatTipsAccount(targetAddress, targetAccount),
            };
        }
        default:
            safeUnreachable(view);
            return null;
    }
}
