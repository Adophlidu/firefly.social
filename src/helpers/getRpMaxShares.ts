import { safeUnreachable } from '@masknet/kit';

import { NetworkType } from '@/constants/enum.js';
import { RED_PACKET_MAX_SHARES, RED_PACKET_MAX_SHARES_SOLANA } from '@/constants/rp.js';

export function getRpMaxShares(networkType: NetworkType) {
    switch (networkType) {
        case NetworkType.Solana:
            return RED_PACKET_MAX_SHARES_SOLANA;
        case NetworkType.Ethereum:
            return RED_PACKET_MAX_SHARES;
        default:
            safeUnreachable(networkType);
            return 0;
    }
}
