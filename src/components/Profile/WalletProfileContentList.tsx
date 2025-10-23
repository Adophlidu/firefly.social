import { memo } from 'react';

import { ProfileActivities } from '@/components/Activities/ProfileActivities.js';
import { PolymarketProfileCard } from '@/components/Polymarket/PolymarketProfileCard.js';
import { NFTs } from '@/components/Profile/NFTs.js';
import { ProfilePolymarketList } from '@/components/Profile/ProfilePolymarketList.js';
import { ProfileTransactions } from '@/components/Transactions/ProfileTransactions.js';
import { WalletProfileCategory } from '@/constants/enum.js';
import { safeUnreachable } from '@/helpers/unreachable.js';

export const WalletProfileContentList = memo(function WalletProfileContentList({
    type,
    address,
}: {
    type: WalletProfileCategory;
    address: string;
}) {
    switch (type) {
        case WalletProfileCategory.NFTs:
            return <NFTs address={address} />;
        case WalletProfileCategory.Activities:
            return <ProfileActivities address={address} />;
        case WalletProfileCategory.Transactions:
            return <ProfileTransactions address={address} />;
        case WalletProfileCategory.Bets:
            return (
                <>
                    <PolymarketProfileCard address={address} />
                    <ProfilePolymarketList address={address} />
                </>
            );
        default:
            safeUnreachable(type);
            return null;
    }
});
