import { isValidAddressEthereum, isValidAddressSolana } from '@dimensiondev/web3-utils';

import { NetworkType } from '@/constants/enum.js';

export function getAddressType(address: string, strict = true) {
    if (isValidAddressEthereum(address)) return NetworkType.Ethereum;
    if (isValidAddressSolana(address, strict)) return NetworkType.Solana;
    return null;
}
