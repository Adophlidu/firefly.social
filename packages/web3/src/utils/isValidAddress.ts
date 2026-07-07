import { type Address, isAddress } from 'viem';

import { decodeBase58 } from '@/utils/decodeBase58.js';

/** A Solana address is an ed25519 public key: exactly 32 bytes, base58-encoded. */
const SOLANA_ADDRESS_BYTE_LENGTH = 32;

export function isValidAddressSolana(address: string | null | undefined, strict = true): boolean {
    const length = address?.length;
    if (!length || length < 32 || length > 44) return false;

    // Matches `new web3.PublicKey(address)`: base58 decode must yield exactly 32 bytes.
    const decoded = decodeBase58(address);
    if (decoded?.length === SOLANA_ADDRESS_BYTE_LENGTH) return true;

    // For broken solana address, such as all lowercase.
    return strict ? false : /^[1-9a-zA-Z]+$/.test(address);
}

export function isValidAddressEthereum(address: string | null | undefined): address is Address {
    const address_ = address?.toLowerCase();
    if (!address_) return false;
    if (!address_.startsWith('0x') && !address_.startsWith('0X')) return false;
    return isAddress(address_ as Address);
}

export function isValidAddressTron(address: string | null | undefined): boolean {
    return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address ?? '');
}

/** Sui token address uses <package>::<module>::<struct>. */
export function isValidTokenAddressSui(address?: string): boolean {
    if (!address) return false;

    const suiTokenPattern = /^0x[a-fA-F0-9]{64}::[a-zA-Z_][a-zA-Z0-9_]*::[a-zA-Z_][a-zA-Z0-9_]*$/;
    const suiTokenPatternWithZeros = /^0x0*[a-fA-F0-9]{1,64}::[a-zA-Z_][a-zA-Z0-9_]*::[a-zA-Z_][a-zA-Z0-9_]*$/;

    return suiTokenPattern.test(address) || suiTokenPatternWithZeros.test(address);
}

export function isValidAddress(address: string | null | undefined, strict = true): boolean {
    return isValidAddressSolana(address, strict) || isValidAddressEthereum(address) || isValidAddressTron(address);
}
