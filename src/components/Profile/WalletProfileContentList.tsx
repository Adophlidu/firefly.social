import { safeUnreachable } from '@masknet/kit';
import { memo } from 'react';

import { ArticleList } from '@/components/Profile/ArticleList.js';
import { NFTs } from '@/components/Profile/NFTs.js';
import { POAPList } from '@/components/Profile/POAPList.js';
import { WalletProfileActivities } from '@/components/Profile/WalletProfileActivities.js';
import { WalletProfilePolymarketList } from '@/components/Profile/WalletProfilePolymarketList.js';
import { WalletProfileSnapshotList } from '@/components/Profile/WalletProfileSnapshotList.js';
import { WalletProfileSwapTimeline } from '@/components/Profile/WalletProfileSwapTimeline.js';
import { WalletProfileCategory } from '@/constants/enum.js';

export const WalletProfileContentList = memo(function WalletProfileContentList({
    type,
    address,
}: {
    type: WalletProfileCategory;
    address: string;
}) {
    switch (type) {
        case WalletProfileCategory.Articles:
            return <ArticleList address={address} />;
        case WalletProfileCategory.POAPs:
            return <POAPList address={address} />;
        case WalletProfileCategory.NFTs:
            return <NFTs address={address} />;
        case WalletProfileCategory.Activities:
            return <WalletProfileActivities address={address} />;
        case WalletProfileCategory.DAOs:
            return <WalletProfileSnapshotList address={address} />;
        case WalletProfileCategory.Polymarket:
            return <WalletProfilePolymarketList address={address} />;
        case WalletProfileCategory.Swap:
            return <WalletProfileSwapTimeline address={address} />;
        default:
            safeUnreachable(type);
            return null;
    }
});
