import { unreachable } from '@dimensiondev/utils';

import { useEthereumAvailability } from '@/components/RedPacket/hooks/useEthereumAvailability.js';
import { useSolanaAvailability } from '@/components/RedPacket/hooks/useSolanaAvailability.js';
import { NetworkType } from '@/constants/enum.js';
import { getNetworkTypeFromRpPayload } from '@/helpers/getNetworkTypeFromRpPayload.js';
import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';

export function useAvailability(payload: RedPacketJSONPayload) {
    const networkType = getNetworkTypeFromRpPayload(payload);
    switch (networkType) {
        case NetworkType.Ethereum:
            return useEthereumAvailability(payload);
        case NetworkType.Solana:
            return useSolanaAvailability(payload);
        default:
            unreachable(networkType);
    }
}
