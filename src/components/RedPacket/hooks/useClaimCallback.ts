import { useAsyncFn } from 'react-use';

import type { SocialSource } from '@/constants/enum.js';
import { getNetworkTypeFromRpPayload } from '@/helpers/getNetworkTypeFromRpPayload.js';
import { useChainContext } from '@/hooks/useChainContext.js';
import { claimRedPacket } from '@/providers/ethereum/red-packet/claimRedPacket.js';
import { captureLuckyDropEvent } from '@/providers/telemetry/captureLuckyDropEvent.js';
import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';
import { EVMChainResolver } from '@/web3-providers/evm/ResolverAPI.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

/**
 * Claim fungible token red packet.
 */
export function useClaimCallback(
    source: SocialSource,
    account: string,
    payload: RedPacketJSONPayload = {} as RedPacketJSONPayload,
) {
    const { chainId: contextChainId } = useChainContext({
        chainId: payload.network ? EVMChainResolver.chainId(payload.network) : EthereumChainId.Mainnet,
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
