import type { SocialSource } from '@dimensiondev/enums';
import { EthChainResolver } from '@dimensiondev/web3/resolvers';
import { useAsyncFn } from 'react-use';
import { mainnet } from 'viem/chains';

import { getNetworkTypeFromRpPayload } from '@/helpers/getNetworkTypeFromRpPayload.js';
import { useChainContext } from '@/hooks/useChainContext.js';
import { claimRedPacket } from '@/providers/ethereum/red-packet/claimRedPacket.js';
import { captureLuckyDropEvent } from '@/providers/telemetry/captureLuckyDropEvent.js';
import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';

/**
 * Claim fungible token red packet.
 */
export function useClaimCallback(
    source: SocialSource,
    account: string,
    payload: RedPacketJSONPayload = {} as RedPacketJSONPayload,
) {
    const { chainId: contextChainId } = useChainContext({
        chainId: payload.network ? EthChainResolver.chainId(payload.network) : mainnet.id,
        networkType: getNetworkTypeFromRpPayload(payload),
    });

    return useAsyncFn(async () => {
        captureLuckyDropEvent('pre-claim', {
            claimer: account,
            payload,
        });
        const hash = await claimRedPacket({
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
