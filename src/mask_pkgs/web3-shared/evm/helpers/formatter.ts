import { BigNumber } from 'bignumber.js';
import { memoize } from 'lodash-es';
import { type Address, checksumAddress } from 'viem';

import { isValidEthereumAddress } from '@/helpers/isValidEthereumAddress.js';
import { isEnsSubdomain, isValidDomain } from '@/mask_pkgs/web3-shared/evm/helpers/isValidDomain.js';

export const formatEthereumAddress: (address: string, size?: number) => string = memoize(
    function formatEthereumAddress(address: string, size = 0) {
        if (!isValidEthereumAddress(address)) return address;
        const address_ = checksumAddress(address as Address);
        if (size === 0 || size >= 20) return address_;
        return `${address_.slice(0, Math.max(0, 2 + size))}...${address_.slice(-size)}`;
    },
    (addr, size) => `${addr}.${size}`,
);

export function formatDomainName(domain: string, size = 18, invalidIgnore?: boolean) {
    if (!domain) return domain;
    if (!isValidDomain(domain) && !invalidIgnore) {
        return domain;
    }
    if (domain.length <= size) return domain;

    if (isEnsSubdomain(domain)) {
        return domain.replace(/^\[([^\]]+?)]\.(.*)$/, (_, hash, mainName): string => {
            return `[${hash.slice(0, 4)}...${hash.slice(-4)}].${formatDomainName(mainName, size, invalidIgnore)}`;
        });
    }

    return domain.replace(/^(.*)\.(\w+)$/, (_, name, suffix): string => {
        return `${name.slice(0, size - 6)}...${name.slice(-2)}.${suffix}`;
    });
}

export function formatWeiToEther(value: BigNumber.Value) {
    return new BigNumber(value).shiftedBy(-18);
}
