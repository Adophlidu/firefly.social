'use client';

import type { Address } from 'viem';
import { useEnsName } from 'wagmi';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

interface WalletEnsNameProps {
    address: string;
}

export function WalletEnsName({ address }: WalletEnsNameProps) {
    const { data, isLoading } = useEnsName({
        address: address as Address,
        chainId: EthereumChainId.Mainnet,
        query: {
            enabled: isValidAddressEthereum(address),
            staleTime: 1000 * 60 * 30,
        },
    });

    if (isLoading) return <LoadingIcon className="ml-2 inline-block" size={16} />;

    return <span className="ml-2 text-base text-second">{data || formatAddress(address, 6, 2, false)}</span>;
}
