import { isValidAddressEthereum, isValidAddressSolana, isValidTokenAddressSui } from '@dimensiondev/web3/utils';
import { memoize } from 'lodash-es';
import { checksumAddress } from 'viem';

type Offset = 0 | 2;

type Formatter = (address: string, size?: number, offset?: Offset, strict?: boolean) => string;

const resolver = (address: string, size = 0) => `${address}.${size}`;

export function formatAddress(address: string, size?: number, offset?: Offset, strict = true) {
    if (isValidAddressSolana(address, strict)) return formatAddressSolana(address, size, offset, strict);
    if (isValidAddressEthereum(address)) return formatAddressEthereum(address, size, offset);
    if (isValidTokenAddressSui(address)) return formatTokenAddressSui(address);
    return address;
}

export const formatAddressSolana: Formatter = memoize(
    function format(address, size = 0, offset = 0, strict = true) {
        if (!isValidAddressSolana(address, strict)) return address;
        if (size === 0 || size >= 22) return address;
        return `${address.slice(0, Math.max(0, offset + size))}...${address.slice(-size)}`;
    },
    (address: string, size = 0, offset = 0, strict = true) => `${address}.${size}.${offset}.${strict}`,
);

export const formatAddressEthereum: Formatter = memoize(function formatEthereumAddress(
    address: string,
    size = 0,
    offset = 2,
) {
    if (!isValidAddressEthereum(address)) return address;
    const address_ = checksumAddress(address);
    if (size === 0 || size >= 20) return address_;
    return `${address_.slice(0, Math.max(0, offset + size))}...${address_.slice(-size)}`;
}, resolver);

export function formatTokenAddressSui(address: string): string {
    if (!isValidTokenAddressSui(address)) return address;

    const parts = address.split('::');
    if (parts.length !== 3) return address;

    const [packageId, moduleName, structName] = parts;

    const packageIdWithoutZeros = packageId.replace(/^0x0+/, '0x');

    return `${packageIdWithoutZeros}::${moduleName}::${structName}`;
}
