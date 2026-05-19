import { NetworkType } from '@dimensiondev/enums';

import { isValidAddressEthereum, isValidAddressSolana } from '@/utils/isValidAddress.js';

export function getAddressType(address: string, strict = true) {
    if (isValidAddressEthereum(address)) return NetworkType.Ethereum;
    if (isValidAddressSolana(address, strict)) return NetworkType.Solana;
    return null;
}
