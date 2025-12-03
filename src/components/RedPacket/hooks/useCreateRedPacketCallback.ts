import { unreachable } from '@dimensiondev/utils';
import { useContext } from 'react';

import { useEthereumCreateRedPacketCallback } from '@/components/RedPacket/hooks/useEthereumCreateRedPacketCallback.js';
import { useSolanaCreateRedPacketCallback } from '@/components/RedPacket/hooks/useSolanaCreateRedPacketCallback.js';
import { NetworkType } from '@/constants/enum.js';
import { RedPacketContext } from '@/modals/RedPacketModal/RedPacketContext.js';
import type { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';

export function useCreateRedPacketCallback(
    shareFromName: string,
    publicKey: string,
    claimRequirements?: FireflyRedPacketAPI.ClaimStrategy[],
) {
    const { networkType } = useContext(RedPacketContext);
    const createEthereumRedPacket = useEthereumCreateRedPacketCallback(shareFromName, publicKey, claimRequirements);
    const createSolanaRedPacket = useSolanaCreateRedPacketCallback(shareFromName, publicKey, claimRequirements);

    switch (networkType) {
        case NetworkType.Ethereum:
            return createEthereumRedPacket;
        case NetworkType.Solana:
            return createSolanaRedPacket;
        default:
            unreachable(networkType);
    }
}
