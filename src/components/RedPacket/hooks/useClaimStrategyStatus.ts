import { useQuery } from '@tanstack/react-query';

import { type SocialSource } from '@/constants/enum.js';
import { getNetworkTypeFromRpPayload } from '@/helpers/getNetworkTypeFromRpPayload.js';
import { useChainContext } from '@/hooks/useChainContext.js';
import { getCurrentClaimProfile } from '@/providers/ethereum/getCurrentClaimProfile.js';
import { FireflyRedPacketEndpoint } from '@/providers/firefly/RedPacketEndpoint.js';
import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';

export function useClaimStrategyStatus(payload: RedPacketJSONPayload, source: SocialSource, enabled = true) {
    const rpid = payload.rpid;

    const { account } = useChainContext({
        chainId: payload.chainId,
        networkType: getNetworkTypeFromRpPayload(payload),
    });

    return useQuery({
        enabled,
        queryKey: ['red-packet', 'claim-strategy', rpid, account],
        queryFn: async () => {
            if (!account) return null;

            const profile = await getCurrentClaimProfile(source);
            if (!profile) return null;

            return FireflyRedPacketEndpoint.checkClaimStrategyStatus({
                rpid,
                profile,
                wallet: {
                    address: account,
                },
            });
        },
    });
}
