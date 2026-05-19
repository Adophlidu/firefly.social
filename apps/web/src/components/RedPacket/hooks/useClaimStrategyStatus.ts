import type { SocialSource } from '@dimensiondev/enums';
import { NetworkType } from '@dimensiondev/enums';
import { useQuery } from '@tanstack/react-query';

import { getNetworkTypeFromRpPayload } from '@/helpers/getNetworkTypeFromRpPayload.js';
import { getCurrentClaimProfile } from '@/providers/ethereum/getCurrentClaimProfile.js';
import { checkClaimStrategyStatus } from '@/providers/firefly/red-packet/checkClaimStrategyStatus.js';
import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';

export function useClaimStrategyStatus(
    payload: RedPacketJSONPayload,
    source: SocialSource,
    account: string,
    enabled = true,
) {
    const rpid = payload.rpid;

    return useQuery({
        enabled,
        queryKey: ['red-packet', 'claim-strategy', rpid, account?.toLowerCase()],
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
