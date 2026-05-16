import { checksumAddress } from 'viem';

import { isValidAddressEthereum, isValidAddressSolana } from '@/shared/src/helpers/isAddress.js';

type Offset = 0 | 2;

export function formatAddress(address: string, size?: number, offset?: Offset) {
    if (isValidAddressSolana(address)) return formatAddressSolana(address, size, offset);
    if (isValidAddressEthereum(address)) return formatAddressEthereum(address, size, offset);
    return address;
}

export function formatAddressSolana(address: string, size = 0, offset = 0) {
    if (!isValidAddressSolana(address)) return address;
    if (size === 0 || size >= 22) return address;
    return `${address.slice(0, Math.max(0, offset + size))}...${address.slice(-size)}`;
}

export function formatAddressEthereum(address: string, size = 0, offset = 2) {
    if (!isValidAddressEthereum(address)) return address;
    const address_ = checksumAddress(address);
    if (size === 0 || size >= 20) return address_;
    return `${address_.slice(0, Math.max(0, offset + size))}...${address_.slice(-size)}`;
}
