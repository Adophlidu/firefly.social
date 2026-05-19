import { NetworkType } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';

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
