import { web3 } from '@coral-xyz/anchor';
import { isAddressEqual } from 'viem';

import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';

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
): boolean {
    try {
        if (!address || !otherAddress) return false;
        return new web3.PublicKey(address).equals(new web3.PublicKey(otherAddress));
    } catch {
        return false;
    }
}

export function isSameAddress(address?: string, otherAddress?: string): boolean {
    return isSameEthereumAddress(address, otherAddress) || isSameSolanaAddress(address, otherAddress);
}
