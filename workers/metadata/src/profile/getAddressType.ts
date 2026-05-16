import { isValidAddressEthereum, isValidAddressSolana } from '@dimensiondev/workers-shared/helpers/isAddress.js';

import { NetworkType } from '@/metadata/src/profile/enums.js';

export function getAddressType(address: string) {
    if (isValidAddressEthereum(address)) return NetworkType.Ethereum;
    if (isValidAddressSolana(address)) return NetworkType.Solana;
    return null;
}
