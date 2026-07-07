import { isAddressEqual } from 'viem';

import { decodeBase58 } from '@/utils/decodeBase58.js';
import { isValidAddressEthereum, isValidAddressSolana, isValidAddressTron } from '@/utils/isValidAddress.js';

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
    if (!address || !otherAddress) return false;
    if (!strict) {
        return (
            isValidAddressSolana(address, strict) &&
            isValidAddressSolana(otherAddress, strict) &&
            address.toLowerCase() === otherAddress.toLowerCase()
        );
    }

    // Matches `new web3.PublicKey(a).equals(new web3.PublicKey(b))`: both sides must
    // base58-decode to exactly 32 bytes, and the decoded bytes must be identical.
    const decoded = decodeBase58(address);
    const otherDecoded = decodeBase58(otherAddress);
    if (decoded?.length !== 32 || otherDecoded?.length !== 32) return false;
    return decoded.every((byte, index) => byte === otherDecoded[index]);
}

export function isSameTronAddress(
    address: string | null | undefined,
    otherAddress: string | null | undefined,
): boolean {
    if (!address || !otherAddress) return false;
    if (!isValidAddressTron(address) || !isValidAddressTron(otherAddress)) return false;
    return address === otherAddress;
}

export function isSameAddress(address: string | undefined, otherAddress: string | undefined): boolean {
    return (
        isSameEthereumAddress(address, otherAddress) ||
        isSameSolanaAddress(address, otherAddress) ||
        isSameTronAddress(address, otherAddress)
    );
}
