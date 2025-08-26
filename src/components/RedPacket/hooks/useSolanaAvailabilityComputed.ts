import { compact } from 'lodash-es';

import { useSolanaAvailability } from '@/components/RedPacket/hooks/useSolanaAvailability.js';
import { getNetworkTypeFromRpPayload } from '@/helpers/getNetworkTypeFromRpPayload.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { useChainContext } from '@/hooks/useChainContext.js';
import { type RedPacketJSONPayload, RedPacketStatus } from '@/providers/types/FireflyRedPacket.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

export function useSolanaAvailabilityComputed(payload: RedPacketJSONPayload, post: Post, enabled = true) {
    const chainId = payload.chainId || SolanaChainId.Mainnet;
    const { data } = useSolanaAvailability(payload, chainId, enabled);
    const { account } = useChainContext({ networkType: getNetworkTypeFromRpPayload(payload) });

    const isEmpty = data?.isEmpty ?? false;
    const isExpired = data?.expired ?? false;
    const isClaimed = data?.isClaimed ?? false;

    const isCreator = isSameAddress(payload.sender?.address ?? '', account);
    const canRefund = isExpired && !isEmpty && isCreator;
    const canClaim = !isExpired && !isEmpty && !isClaimed;
    const isRefunded = data?.isRefunded || (isEmpty && (data?.hasShares ?? false));

    return {
        isSponsorable: false,
        parsedChainId: chainId,
        availability: data,
        password: payload.password,
        isExpired,
        computed: {
            canClaim,
            canRefund,
            listOfStatus: compact([
                isClaimed ? RedPacketStatus.claimed : undefined,
                isEmpty ? RedPacketStatus.empty : undefined,
                isRefunded ? RedPacketStatus.refunded : undefined,
                isExpired ? RedPacketStatus.expired : undefined,
            ]),
        },
        isEmpty,
        isClaimed,
    };
}
