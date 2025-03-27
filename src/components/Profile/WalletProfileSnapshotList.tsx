'use client';

import { useWalletMixAddresses } from '@/components/Profile/useWalletMixAddresses.js';
import { FollowingSnapshotList } from '@/components/Snapshot/FollowingSnapshotList.js';

export function WalletProfileSnapshotList({ address }: { address: string }) {
    const addresses = useWalletMixAddresses(address);
    return <FollowingSnapshotList walletAddresses={addresses} />;
}
