import { useAsyncFn } from 'react-use';

import type { SocialSource } from '@/constants/enum.js';
import { getNetworkTypeFromRpPayload } from '@/helpers/getNetworkTypeFromRpPayload.js';
import { useChainContext } from '@/hooks/useChainContext.js';
import { RedPacketProvider } from '@/providers/ethereum/RedPacket.js';
import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';
import { captureLuckyDropEvent } from '@/providers/telemetry/captureLuckyDropEvent.js';

/**
 * Claim fungible token red packet.
 */
export function useClaimCallback(
    source: SocialSource,
    account: string,
    payload: RedPacketJSONPayload = {} as RedPacketJSONPayload,
) {
    const { chainId: contextChainId } = useChainContext({
        chainId: payload.chainId,
        networkType: getNetworkTypeFromRpPayload(payload),
    });

    return useAsyncFn(async () => {
        const hash = await RedPacketProvider.claimRedPacket({
            contextChainId,
            account,
            source,
            payload,
        });

        captureLuckyDropEvent('claim', {
            claimer: account,
            payload,
        });

        return hash;
    }, [account, source, contextChainId, payload]);
}
