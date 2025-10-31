import { safeUnreachable } from '@firefly/utils';

import { NetworkType } from '@/constants/enum.js';

export function resolveNetworkIcon(networkType: NetworkType, isDarkMode: boolean) {
    switch (networkType) {
        case NetworkType.Solana:
            return '/image/chains/solana.png';
        case NetworkType.Ethereum:
            return isDarkMode ? '/image/chains/ethereum.dark.png' : '/image/chains/ethereum.light.png';
        default:
            safeUnreachable(networkType);
            return null;
    }
}
