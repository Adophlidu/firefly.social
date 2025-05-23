import { safeUnreachable } from '@masknet/kit';
import { memo } from 'react';

import { ProfileActivities } from '@/components/Activities/ProfileActivities.js';
import { NFTs } from '@/components/Profile/NFTs.js';
import { POAPList } from '@/components/Profile/POAPList.js';
import { ProfileTransactions } from '@/components/Transactions/ProfileTransactions.js';
import { WalletProfileCategory } from '@/constants/enum.js';

export const WalletProfileContentList = memo(function WalletProfileContentList({
    type,
    address,
}: {
    type: WalletProfileCategory;
    address: string;
}) {
    switch (type) {
        case WalletProfileCategory.POAPs:
            return <POAPList address={address} />;
        case WalletProfileCategory.NFTs:
            return <NFTs address={address} />;
        case WalletProfileCategory.Activities:
            return <ProfileActivities address={address} />;
        case WalletProfileCategory.Transactions:
            return <ProfileTransactions address={address} />;
        default:
            safeUnreachable(type);
            return null;
    }
});
