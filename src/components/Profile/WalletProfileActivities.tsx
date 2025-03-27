'use client';

import { FollowingNFTList } from '@/components/NFTs/FollowingNFTList.js';
import { useWalletMixAddresses } from '@/components/Profile/useWalletMixAddresses.js';

export function WalletProfileActivities({ address }: { address: string }) {
    const addresses = useWalletMixAddresses(address);
    return <FollowingNFTList walletAddresses={addresses} />;
}
