import { useQuery } from '@tanstack/react-query';

import { NetworkType, type SocialSource } from '@/constants/enum.js';
import { getNetworkTypeFromRpPayload } from '@/helpers/getNetworkTypeFromRpPayload.js';
import { useChainContext } from '@/hooks/useChainContext.js';
import { getCurrentClaimProfile } from '@/providers/ethereum/getCurrentClaimProfile.js';
import { checkClaimStrategyStatus } from '@/providers/firefly/red-packet/checkClaimStrategyStatus.js';
import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';
import { EVMChainResolver } from '@/web3-providers/evm/ResolverAPI.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

export function useClaimStrategyStatus(payload: RedPacketJSONPayload, source: SocialSource, enabled = true) {
    const rpid = payload.rpid;

    const { account } = useChainContext({
        chainId: payload.network ? EVMChainResolver.chainId(payload.network) : EthereumChainId.Mainnet,
        networkType: getNetworkTypeFromRpPayload(payload),
    });

    return useQuery({
        enabled,
        queryKey: ['red-packet', 'claim-strategy', rpid, account],
        queryFn: async () => {
            if (!account) return null;

            const profile = await getCurrentClaimProfile(source);
            if (!profile) return null;

            return checkClaimStrategyStatus({
                isSolana: getNetworkTypeFromRpPayload(payload) === NetworkType.Solana,
                rpid,
                profile,
                wallet: {
                    address: account,
                },
            });
        },
    });
}
