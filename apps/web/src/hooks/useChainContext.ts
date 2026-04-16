import { unreachable } from '@dimensiondev/utils';
import { mainnet } from 'viem/chains';
import { useChainId, useConnection } from 'wagmi';

import { NetworkType } from '@/constants/enum.js';
import { useSolanaWalletProvider } from '@/hooks/useSolanaWalletProvider.js';
import { EVMChainResolver } from '@/web3-providers/evm/ResolverAPI.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

export interface ChainContextOverrides {
    chainId?: number;
    account?: string;
    networkType?: NetworkType;
}

export function useChainContext(overrides?: ChainContextOverrides) {
    const account = useConnection();
    const chainId = useChainId();

    const walletProvider = useSolanaWalletProvider();

    const isEIP1559 = EVMChainResolver.isFeatureSupported(chainId, 'EIP1559') ? 'eip1559' : 'legacy';
    const networkType = overrides?.networkType ?? NetworkType.Ethereum;

    switch (networkType) {
        case NetworkType.Ethereum:
            return {
                account: overrides?.account ?? account.address ?? '',
                chainId: overrides?.chainId ?? chainId ?? mainnet.id,
                isEIP1559,
            };
        case NetworkType.Solana:
            return {
                account: overrides?.account ?? walletProvider?.publicKey?.toBase58() ?? '',
                chainId: overrides?.chainId ?? SolanaChainId.Mainnet,
            };
        default:
            unreachable(networkType);
    }
}
