import { safeUnreachable } from '@dimensiondev/utils';
import { memo } from 'react';

import { ProfileActivities } from '@/components/Activities/ProfileActivities.js';
import { ProfilePredictionTimeline } from '@/components/Prediction/ProfilePredictionTimeline.js';
import { ProfileNFTs } from '@/components/Profile/NFTs.js';
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
        case WalletProfileCategory.NFTs:
            return <ProfileNFTs address={address} />;
        case WalletProfileCategory.Activities:
            return <ProfileActivities address={address} />;
        case WalletProfileCategory.Transactions:
            return <ProfileTransactions address={address} />;
        case WalletProfileCategory.Prediction:
            return <ProfilePredictionTimeline address={address} />;
        default:
            safeUnreachable(type);
            return null;
    }
});
