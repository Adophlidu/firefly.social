import { safeUnreachable } from '@dimensiondev/utils';
import { NetworkType } from '@dimensiondev/web3/enums';

import {
    MESSAGE_MAX_LENGTH,
    MESSAGE_MAX_LENGTH_SOLANA,
    RED_PACKET_MAX_SHARES,
    RED_PACKET_MAX_SHARES_SOLANA,
} from '@/constants/rp.js';

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

export function getRpMessageMaxLength(networkType: NetworkType) {
    switch (networkType) {
        case NetworkType.Solana:
            return MESSAGE_MAX_LENGTH_SOLANA;
        case NetworkType.Ethereum:
            return MESSAGE_MAX_LENGTH;
        default:
            safeUnreachable(networkType);
            return 0;
    }
}
