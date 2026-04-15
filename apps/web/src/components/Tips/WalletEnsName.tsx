'use client';

import { isValidAddressEthereum } from '@dimensiondev/web3/utils';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { useEnsName } from '@/hooks/useEnsName.js';

interface WalletEnsNameProps {
    address: string;
}

export function WalletEnsName({ address }: WalletEnsNameProps) {
    const { data, isLoading } = useEnsName(address, isValidAddressEthereum(address));

    if (isLoading) return <LoadingIcon className="ml-2 inline-block" size={16} />;

    return <span className="text-second ml-2 text-base">{data || formatAddress(address, 6, 2, false)}</span>;
}
