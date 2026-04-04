import { unreachable } from '@dimensiondev/utils';

import { useEthereumAvailability } from '@/components/RedPacket/hooks/useEthereumAvailability.js';
import { useSolanaAvailability } from '@/components/RedPacket/hooks/useSolanaAvailability.js';
import { NetworkType } from '@/constants/enum.js';
import { getNetworkTypeFromRpPayload } from '@/helpers/getNetworkTypeFromRpPayload.js';
import { type RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';

export function useAvailability(payload: RedPacketJSONPayload) {
    const networkType = getNetworkTypeFromRpPayload(payload);
    const ethereum = useEthereumAvailability(payload, { enabled: networkType === NetworkType.Ethereum });
    const solana = useSolanaAvailability(payload, { enabled: networkType === NetworkType.Solana });
    switch (networkType) {
        case NetworkType.Ethereum:
            return ethereum;
        case NetworkType.Solana:
            return solana;
        default:
            unreachable(networkType);
    }
}
