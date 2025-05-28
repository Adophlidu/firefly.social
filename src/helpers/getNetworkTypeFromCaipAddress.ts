import type { CaipAddress } from '@reown/appkit';

import { NetworkType } from '@/constants/enum.js';

export function getNetworkTypeFromCaipAddress(caipAddress: CaipAddress) {
    if (caipAddress.startsWith('eip155:')) {
        return NetworkType.Ethereum;
    }
    if (caipAddress.startsWith('solana:')) {
        return NetworkType.Solana;
    }

    return;
}
