import { unreachable } from '@masknet/kit';

import { useEvmDefaultGas } from '@/components/RedPacket/hooks/useEvmDefaultGas.js';
import { useSolanaDefaultGas } from '@/components/RedPacket/hooks/useSolanaDefaultGas.js';
import { NetworkType } from '@/constants/enum.js';
import { type CreateRedPacketContext } from '@/providers/ethereum/RedPacket.js';

export function useDefaultCreateGas(context: CreateRedPacketContext) {
    const { networkType } = context;
    const evmDefaultGas = useEvmDefaultGas(context, networkType === NetworkType.Ethereum);
    const solanaDefaultGas = useSolanaDefaultGas(context, networkType === NetworkType.Solana);

    switch (networkType) {
        case NetworkType.Solana:
            return solanaDefaultGas;
        case NetworkType.Ethereum:
            return evmDefaultGas;
        default:
            unreachable(networkType);
    }
}
