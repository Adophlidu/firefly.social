import { NetworkType } from '@dimensiondev/web3/enums';
import { isValidAddressEthereum, isValidAddressSolana } from '@dimensiondev/workers-shared/helpers/isAddress.js';

export function getAddressType(address: string) {
    if (isValidAddressEthereum(address)) return NetworkType.Ethereum;
    if (isValidAddressSolana(address)) return NetworkType.Solana;
    return null;
}
