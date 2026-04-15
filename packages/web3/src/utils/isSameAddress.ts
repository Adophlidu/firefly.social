import { web3 } from '@coral-xyz/anchor';
import { isAddressEqual } from 'viem';

import { isValidAddressEthereum, isValidAddressSolana } from '@/utils/isValidAddress.js';

export function isSameEthereumAddress(
    address: string | null | undefined,
    otherAddress: string | null | undefined,
): boolean {
    if (!address || !otherAddress) return false;
    if (!isValidAddressEthereum(address) || !isValidAddressEthereum(otherAddress)) return false;
    return isAddressEqual(address, otherAddress);
}

export function isSameSolanaAddress(
    address: string | null | undefined,
    otherAddress: string | null | undefined,
    strict = true,
): boolean {
    try {
        if (!address || !otherAddress) return false;
        if (!strict) {
            return (
                isValidAddressSolana(address, strict) &&
                isValidAddressSolana(otherAddress, strict) &&
                address.toLowerCase() === otherAddress.toLowerCase()
            );
        }

        return new web3.PublicKey(address).equals(new web3.PublicKey(otherAddress));
    } catch {
        return false;
    }
}

export function isSameAddress(address: string | undefined, otherAddress: string | undefined): boolean {
    return isSameEthereumAddress(address, otherAddress) || isSameSolanaAddress(address, otherAddress);
}
