import { type Address, isAddress } from 'viem';

export function isValidEthereumAddress(address: string | undefined): address is Address {
    const address_ = address?.toLowerCase();
    if (!address_) return false;
    if (!address_.startsWith('0x') && !address_.startsWith('0X')) return false;
    return isAddress(address_ as Address);
}
