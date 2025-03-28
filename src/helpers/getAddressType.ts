import { NetworkType } from '@/constants/enum.js';
import { isValidAddressEthereum, isValidAddressSolana } from '@/helpers/isValidAddress.js';

export function getAddressType(address: string) {
    if (isValidAddressEthereum(address)) return NetworkType.Ethereum;
    if (isValidAddressSolana(address)) return NetworkType.Solana;
    return null;
}
