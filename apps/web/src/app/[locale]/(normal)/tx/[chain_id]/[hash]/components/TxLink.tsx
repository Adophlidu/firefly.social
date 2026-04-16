'use client';

import { classNames, runInSafe } from '@dimensiondev/utils';
import { formatAddress } from '@dimensiondev/web3/utils';
import { type PropsWithChildren, useMemo } from 'react';

import { Link } from '@/esm/Link.js';
import { bedStead } from '@/fonts/bedStead/index.js';
import { isValidChainIdSolana } from '@/helpers/isValidChainId.js';
import { resolveExplorerLink } from '@/helpers/resolveExplorerLink.js';

interface TxLinkProps extends PropsWithChildren {
    chainId: number;
    hash: string;
}

function getTransactionLink(chainId: number, txHash: string) {
    if (isValidChainIdSolana(chainId)) {
        return `https://solscan.io/tx/${txHash}`;
    }

    return resolveExplorerLink(chainId, txHash, 'tx');
}

export function TxLink({ chainId, hash, children }: TxLinkProps) {
    const txLink = useMemo(() => runInSafe(() => getTransactionLink(chainId, hash)), [chainId, hash]);

    if (txLink) {
        return (
            <Link
                target="_blank"
                rel="noreferrer"
                href={txLink}
                className={classNames('text-highlight flex items-center gap-1 text-sm font-medium', bedStead.className)}
            >
                {hash.slice(0, 6)}...{hash.slice(-4)}
                {children}
            </Link>
        );
    }

    return (
        <span className={classNames('text-highlight flex items-center gap-1 text-sm font-medium', bedStead.className)}>
            {hash.slice(0, 6)}...{hash.slice(-4)}
            {children}
        </span>
    );
}

function getAddressLink(chainId: number, address: string) {
    if (isValidChainIdSolana(chainId)) {
        return `https://solscan.io/account/${address}`;
    }

    return resolveExplorerLink(chainId, address, 'address');
}

export function AddressLink({ chainId, address }: { chainId: number; address: string }) {
    const addressLink = useMemo(() => runInSafe(() => getAddressLink(chainId, address)), [chainId, address]);

    if (addressLink) {
        return (
            <Link
                href={addressLink}
                target="_blank"
                rel="noreferrer"
                className={classNames('text-highlight text-sm font-medium', bedStead.className)}
            >
                {formatAddress(address, 4)}
            </Link>
        );
    }

    return (
        <span className={classNames('text-highlight text-sm font-medium', bedStead.className)}>
            {formatAddress(address, 4)}
        </span>
    );
}
