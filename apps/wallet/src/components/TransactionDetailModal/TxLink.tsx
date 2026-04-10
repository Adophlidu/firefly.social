import { runInSafe } from '@dimensiondev/utils';
import { type PropsWithChildren, useMemo } from 'react';

import { bedStead } from '@/fonts/bedStead/index.js';
import { getBlockExplorersURL } from '@/helpers/getBlockExplorersURL.js';
import { cn } from '@/lib/utils.js';

interface TxLinkProps extends PropsWithChildren {
    chainId: number;
    hash: string;
}

export function TxLink({ chainId, hash, children }: TxLinkProps) {
    const txLink = useMemo(() => runInSafe(() => getBlockExplorersURL(chainId, hash, 'tx')), [chainId, hash]);

    if (txLink) {
        return (
            <a
                target="_blank"
                rel="noopener noreferrer"
                href={txLink}
                className={cn('text-highlight flex items-center gap-1 text-sm font-medium', bedStead.className)}
            >
                {hash.slice(0, 6)}...{hash.slice(-4)}
                {children}
            </a>
        );
    }

    return (
        <span className={cn('text-highlight flex items-center gap-1 text-sm font-medium', bedStead.className)}>
            {hash.slice(0, 6)}...{hash.slice(-4)}
            {children}
        </span>
    );
}
