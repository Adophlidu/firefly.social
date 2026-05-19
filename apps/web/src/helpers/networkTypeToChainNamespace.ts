import { NetworkType } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';

import type { ChainNamespace } from '@/types/utility.js';

export function networkTypeToChainNamespace(networkType: NetworkType): ChainNamespace | null {
    switch (networkType) {
        case NetworkType.Ethereum:
            return 'eip155';
        case NetworkType.Solana:
            return 'solana';
        default:
            safeUnreachable(networkType);
            return null;
    }
}
