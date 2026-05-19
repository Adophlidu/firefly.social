import { NetworkType } from '@dimensiondev/enums';

export function getNetworkTypeFromCaipAddress(caipAddress: string) {
    if (caipAddress.startsWith('eip155:')) return NetworkType.Ethereum;
    if (caipAddress.startsWith('solana:')) return NetworkType.Solana;
    return;
}
