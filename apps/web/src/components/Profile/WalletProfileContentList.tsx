import { WalletProfileCategory } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import { memo } from 'react';

import { ProfileActivities } from '@/components/Activities/ProfileActivities.js';
import { ProfilePredictionTimeline } from '@/components/Prediction/ProfilePredictionTimeline.js';
import { ProfileTransactions } from '@/components/Transactions/ProfileTransactions.js';

export const WalletProfileContentList = memo(function WalletProfileContentList({
    type,
    address,
}: {
    type: WalletProfileCategory;
    address: string;
}) {
    switch (type) {
        case WalletProfileCategory.Activities:
            return <ProfileActivities address={address} />;
        case WalletProfileCategory.Transactions:
            return <ProfileTransactions address={address} />;
        case WalletProfileCategory.Prediction:
        case WalletProfileCategory.Bets:
            return <ProfilePredictionTimeline address={address} />;
        case WalletProfileCategory.NFTs:
            return null;
        default:
            safeUnreachable(type);
            return null;
    }
});
