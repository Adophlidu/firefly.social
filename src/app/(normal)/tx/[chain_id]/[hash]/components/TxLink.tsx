'use client';

import { useMemo } from 'react';

import { Link } from '@/esm/Link.js';
import { bedStead } from '@/fonts/bedStead/index.js';
import { classNames } from '@/helpers/classNames.js';
import { isValidChainIdSolana } from '@/helpers/isValidChainId.js';
import { resolveExplorerLink } from '@/helpers/resolveExplorerLink.js';
import { runInSafe } from '@/helpers/runInSafe.js';

interface TxLinkProps {
    chainId: number;
    hash: string;
}

function getTransactionLink(chainId: number, txHash: string) {
    if (isValidChainIdSolana(chainId)) {
        return `https://solscan.io/tx/${txHash}`;
    }

    return resolveExplorerLink(chainId, txHash, 'tx');
}

export function TxLink({ chainId, hash }: TxLinkProps) {
    const txLink = useMemo(() => runInSafe(() => getTransactionLink(chainId, hash)), [chainId, hash]);

    if (txLink) {
        return (
            <Link
                target="_blank"
                rel="noreferrer"
                href={txLink}
                className={classNames('text-sm font-medium text-highlight', bedStead.className)}
            >
                {hash.slice(0, 6)}...{hash.slice(-4)}
            </Link>
        );
    }

    return (
        <span className={classNames('text-sm font-medium text-highlight', bedStead.className)}>
            {hash.slice(0, 6)}...{hash.slice(-4)}
        </span>
    );
}
