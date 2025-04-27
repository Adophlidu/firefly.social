'use client';

import { FollowingNFTList } from '@/components/NFTs/FollowingNFTList.js';

export function WalletProfileActivities({ address }: { address: string }) {
    return <FollowingNFTList walletAddress={address} />;
}
