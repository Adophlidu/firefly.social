import { unreachable } from '@dimensiondev/utils';
import { mainnet } from 'viem/chains';
import { useAccount, useChainId } from 'wagmi';

import { NetworkType } from '@/constants/enum.js';
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
                chainId: overrides?.chainId ?? chainId ?? mainnet.id,
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
