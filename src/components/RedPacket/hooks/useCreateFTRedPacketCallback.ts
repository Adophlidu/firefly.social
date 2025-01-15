import { unreachable } from '@masknet/kit';
import { useContext } from 'react';

import { useCreateRedPacketCallbackEVM } from '@/components/RedPacket/hooks/useCreateRedPacketCallbackEVM.js';
import { useCreateSolanaRedPacketCallback } from '@/components/RedPacket/hooks/useCreateSolanaRedPacketCallback.js';
import { NetworkType } from '@/constants/enum.js';
import { RedPacketContext } from '@/modals/RedPacketModal/RedPacketContext.js';
import type { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';

export function useCreateFTRedPacketCallback(
    shareFromName: string,
    publicKey: string,
    claimRequirements?: FireflyRedPacketAPI.StrategyPayload[],
) {
    const { networkType } = useContext(RedPacketContext);
    const createEvmRedPacket = useCreateRedPacketCallbackEVM(shareFromName, publicKey, claimRequirements);
    const createSolanaRedPacket = useCreateSolanaRedPacketCallback(shareFromName, claimRequirements);

    switch (networkType) {
        case NetworkType.Ethereum:
            return createEvmRedPacket;
        case NetworkType.Solana:
            return createSolanaRedPacket;
        default:
            unreachable(networkType);
    }
}
