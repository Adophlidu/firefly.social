import bs58 from 'bs58';
import { type Address, isAddress } from 'viem';

export function isValidAddressSolana(address?: string): boolean {
    if (!address || address.length < 32 || address.length > 44) return false;

    try {
        const decoded = bs58.decode(address);
        return decoded.length === 32; // Solana public keys are always 32 bytes
    } catch {
        return false;
    }
}

export function isValidAddressEthereum(address: string | undefined): address is Address {
    const address_ = address?.toLowerCase();
    if (!address_) return false;
    if (!address_.startsWith('0x') && !address_.startsWith('0X')) return false;
    return isAddress(address_ as Address);
}

export function isValidAddress(address?: string) {
    return isValidAddressSolana(address) || isValidAddressEthereum(address);
}
