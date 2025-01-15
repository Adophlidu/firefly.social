import { unreachable } from '@masknet/kit';

import { useVerifyAndClaimEVM } from '@/components/RedPacket/hooks/useVerifyAndClaimEVM.js';
import { useVerifyAndClaimSolana } from '@/components/RedPacket/hooks/useVerifyAndClaimSolana.js';
import { NetworkType, type SocialSource } from '@/constants/enum.js';
import { getNetworkTypeFromRpPayload } from '@/helpers/getNetworkTypeFromRpPayload.js';
import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export function useVerifyAndClaim(payload: RedPacketJSONPayload, source: SocialSource, post: Post) {
    const networkType = getNetworkTypeFromRpPayload(payload);

    const claimWithEVM = useVerifyAndClaimEVM(payload, source, post, networkType === NetworkType.Ethereum);
    const claimWithSolana = useVerifyAndClaimSolana(payload, post, networkType === NetworkType.Solana);

    switch (networkType) {
        case NetworkType.Solana:
            return claimWithSolana;
        case NetworkType.Ethereum:
            return claimWithEVM;
        default:
            unreachable(networkType);
    }
}
