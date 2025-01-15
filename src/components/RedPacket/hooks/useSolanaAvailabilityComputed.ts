import { ChainId } from '@masknet/web3-shared-solana';

import { useSolanaAvailability } from '@/components/RedPacket/hooks/useSolanaAvailability.js';
import type { RedPacketJSONPayload, RedPacketStatus } from '@/providers/types/FireflyRedPacket.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export function useSolanaAvailabilityComputed(payload: RedPacketJSONPayload, post: Post, enabled = true) {
    const chainId = payload.chainId || ChainId.Mainnet;
    const { data } = useSolanaAvailability(payload, chainId, enabled);

    return {
        isSponsorable: false,
        parsedChainId: chainId,
        availability: data,
        password: payload.password,
        isExpired: data?.expired || false,
        computed: { canClaim: true, canRefund: false, listOfStatus: [] as RedPacketStatus[] },
        isEmpty: data?.isEmpty || false,
        isClaimed: data?.isClaimed || false,
    };
}
