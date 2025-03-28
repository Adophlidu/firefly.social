import { unreachable } from '@masknet/kit';
import { EthereumChainId } from '@masknet/web3-shared-evm';
import { SolanaChainId } from '@masknet/web3-shared-solana';
import { useAccount, useChainId } from 'wagmi';

import { NetworkType } from '@/constants/enum.js';
import { useSolanaWalletProvider } from '@/hooks/useSolanaWalletProvider.js';
import { EVMChainResolver } from '@/mask/index.js';

export interface ChainContextOverrides {
    chainId?: number;
    account?: string;
    networkType?: NetworkType;
}

export function useChainContext(overrides?: ChainContextOverrides) {
    const account = useAccount();
    const chainId = useChainId();

    const walletProvider = useSolanaWalletProvider();

    const isEIP1559 = EVMChainResolver.isFeatureSupported(chainId, 'EIP1559') ? 'eip1559' : 'legacy';
    const networkType = overrides?.networkType ?? NetworkType.Ethereum;

    switch (networkType) {
        case NetworkType.Ethereum:
            return {
                account: overrides?.account ?? account.address ?? '',
                chainId: overrides?.chainId ?? chainId ?? EthereumChainId.Mainnet,
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
