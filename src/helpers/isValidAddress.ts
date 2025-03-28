import bs58 from 'bs58';
import { type Address, isAddress } from 'viem';

export function isValidAddressSolana(address?: string): address is string {
    const length = address?.length;
    if (!length || length < 32 || length > 44) return false;
    try {
        const buffer = bs58.decode(address);
        return buffer.byteLength === 32;
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
