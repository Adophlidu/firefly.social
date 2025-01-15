import { useAsyncFn } from 'react-use';

import type { SocialSource } from '@/constants/enum.js';
import { getNetworkTypeFromRpPayload } from '@/helpers/getNetworkTypeFromRpPayload.js';
import { useChainContext } from '@/hooks/useChainContext.js';
import { RedPacketProvider } from '@/providers/ethereum/RedPacket.js';
import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';

/**
 * Claim fungible token red packet.
 */
export function useClaimCallback(
    account: string,
    payload: RedPacketJSONPayload = {} as RedPacketJSONPayload,
    source: SocialSource,
) {
    const { chainId: contextChainId } = useChainContext({
        chainId: payload.chainId,
        networkType: getNetworkTypeFromRpPayload(payload),
    });

    return useAsyncFn(async () => {
        return RedPacketProvider.claimRedPacket({
            contextChainId,
            account,
            source,
            payload,
        });
    }, [account, source, contextChainId, payload]);
}
