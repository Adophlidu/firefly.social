import { checksumAddress } from 'viem';

import { isValidAddressEthereum, isValidAddressSolana, isValidTokenAddressSui } from '@/utils/isValidAddress.js';

type Offset = 0 | 2;

type Formatter = (address: string, size?: number, offset?: Offset, strict?: boolean) => string;

const solanaCache = new Map<string, string>();
const ethereumCache = new Map<string, string>();

export function formatAddress(address: string, size?: number, offset?: Offset, strict = true) {
    if (isValidAddressSolana(address, strict)) return formatAddressSolana(address, size, offset, strict);
    if (isValidAddressEthereum(address)) return formatAddressEthereum(address, size, offset);
    if (isValidTokenAddressSui(address)) return formatTokenAddressSui(address);
    return address;
}

export const formatAddressSolana: Formatter = function format(address, size = 0, offset = 0, strict = true) {
    const cacheKey = `${address}.${size}.${offset}.${strict}`;
    const cached = solanaCache.get(cacheKey);
    if (cached) return cached;

    const result = isValidAddressSolana(address, strict)
        ? size === 0 || size >= 22
            ? address
            : `${address.slice(0, Math.max(0, offset + size))}...${address.slice(-size)}`
        : address;

    solanaCache.set(cacheKey, result);
    return result;
};

export const formatAddressEthereum: Formatter = function formatEthereumAddress(address: string, size = 0, offset = 2) {
    const cacheKey = `${address}.${size}`;
    const cached = ethereumCache.get(cacheKey);
    if (cached) return cached;

    const result = isValidAddressEthereum(address)
        ? (() => {
              const address_ = checksumAddress(address);
              if (size === 0 || size >= 20) return address_;
              return `${address_.slice(0, Math.max(0, offset + size))}...${address_.slice(-size)}`;
          })()
        : address;

    ethereumCache.set(cacheKey, result);
    return result;
};

export function formatTokenAddressSui(address: string): string {
    if (!isValidTokenAddressSui(address)) return address;

    const parts = address.split('::');
    if (parts.length !== 3) return address;

    const [packageId, moduleName, structName] = parts;

    const packageIdWithoutZeros = packageId.replace(/^0x0+/, '0x');

    return `${packageIdWithoutZeros}::${moduleName}::${structName}`;
}
