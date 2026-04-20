import { unreachable } from '@dimensiondev/utils';
import { solana } from '@dimensiondev/web3/chains';
import { NetworkType } from '@dimensiondev/web3/enums';
import { mainnet } from 'viem/chains';
import { useAccount, useChainId } from 'wagmi';

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
                chainId: overrides?.chainId ?? solana.id,
            };
        default:
            unreachable(networkType);
    }
}
