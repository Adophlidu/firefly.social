'use client';

import { formatAddress, isValidAddressEthereum } from '@dimensiondev/web3/utils';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { useEnsName } from '@/hooks/useEnsName.js';

interface WalletEnsNameProps {
    address: string;
}

export function WalletEnsName({ address }: WalletEnsNameProps) {
    const { data, isLoading } = useEnsName(address, isValidAddressEthereum(address));

    if (isLoading) return <LoadingIcon className="ml-2 inline-block" size={16} />;

    return <span className="ml-2 text-base text-second">{data || formatAddress(address, 6, 2, false)}</span>;
}
