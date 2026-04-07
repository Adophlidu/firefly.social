import { unreachable } from '@dimensiondev/utils';
import { useAccount, useChainId } from 'wagmi';

import { NetworkType } from '@/constants/enum.js';
import { EthereumChainId } from '@/constants/ethereum.js';
import { SolanaChainId } from '@/constants/solana.js';

export interface ChainContextOverrides {
    chainId?: number;
    account?: string;
    networkType?: NetworkType;
}

export function useChainContext(overrides?: ChainContextOverrides) {
    const account = useAccount();
    const chainId = useChainId();

    const networkType = overrides?.networkType ?? NetworkType.Ethereum;

    switch (networkType) {
        case NetworkType.Ethereum:
            return {
                account: overrides?.account ?? account.address ?? '',
                chainId: overrides?.chainId ?? chainId ?? EthereumChainId.Mainnet,
            };
        case NetworkType.Solana:
            return {
                account: overrides?.account ?? '',
                chainId: overrides?.chainId ?? SolanaChainId.Mainnet,
            };
        default:
            unreachable(networkType);
    }
}
