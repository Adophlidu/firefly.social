import { unreachable } from '@dimensiondev/utils';
import { NetworkType } from '@dimensiondev/web3/enums';

import { useEthereumDefaultGas } from '@/components/RedPacket/hooks/useEthereumDefaultGas.js';
import { useSolanaDefaultGas } from '@/components/RedPacket/hooks/useSolanaDefaultGas.js';
import type { CreateRedPacketContext } from '@/providers/ethereum/red-packet/types.js';

export function useDefaultCreateGas(context: CreateRedPacketContext) {
    const { networkType } = context;
    const ethereumDefaultGas = useEthereumDefaultGas(context, networkType === NetworkType.Ethereum);
    const solanaDefaultGas = useSolanaDefaultGas(context, networkType === NetworkType.Solana);

    switch (networkType) {
        case NetworkType.Solana:
            return solanaDefaultGas;
        case NetworkType.Ethereum:
            return ethereumDefaultGas;
        default:
            unreachable(networkType);
    }
}
