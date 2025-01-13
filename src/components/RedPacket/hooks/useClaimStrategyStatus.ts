import { useQuery } from '@tanstack/react-query';

import { useCurrentClaimProfile } from '@/components/RedPacket/hooks/useCurrentClaimProfile.js';
import type { SocialSource } from '@/constants/enum.js';
import { useChainContext } from '@/hooks/useChainContext.js';
import { FireflyRedPacketEndpoint } from '@/providers/firefly/RedPacketEndpoint.js';
import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';

export function useClaimStrategyStatus(payload: RedPacketJSONPayload, source: SocialSource) {
    const rpid = payload.rpid;

    const { account } = useChainContext({
        chainId: payload.chainId,
    });

    const signedMessage = 'privateKey' in payload ? payload.privateKey : payload.password;
    const { data: profile } = useCurrentClaimProfile(source);

    return useQuery({
        enabled: !signedMessage,
        queryKey: ['red-packet', 'claim-strategy', rpid, profile?.profileId, account],
        queryFn: async () => {
            if (!profile || !account) return null;
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
