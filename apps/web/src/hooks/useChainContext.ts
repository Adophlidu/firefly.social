import { unreachable } from '@dimensiondev/utils';
import { solana } from '@dimensiondev/web3/chains';
import { NetworkType } from '@dimensiondev/web3/enums';
import { mainnet } from 'viem/chains';
import { useChainId, useConnection } from 'wagmi';

import { useSolanaWalletProvider } from '@/hooks/useSolanaWalletProvider.js';
import { EVMChainResolver } from '@/web3-providers/evm/ResolverAPI.js';

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
                chainId: overrides?.chainId ?? solana.id,
            };
        default:
            unreachable(networkType);
    }
}
