import { NetworkType } from '@/constants/enum.js';
import { isValidAddressEthereum, isValidAddressSolana } from '@/helpers/isValidAddress.js';

export function getAddressType(address: string, strict = true) {
    if (isValidAddressEthereum(address)) return NetworkType.Ethereum;
    if (isValidAddressSolana(address, strict)) return NetworkType.Solana;
    return null;
}
