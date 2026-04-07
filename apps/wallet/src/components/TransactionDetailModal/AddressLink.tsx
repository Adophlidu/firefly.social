import { useMemo } from 'react';

import { bedStead } from '@/fonts/bedStead/index.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { getBlockExplorersURL } from '@/helpers/getBlockExplorersURL.js';
import { runInSafe } from '@/helpers/runInSafe.js';
import { cn } from '@/lib/utils.js';

export function AddressLink({ chainId, address }: { chainId: number; address: string }) {
    const addressLink = useMemo(
        () => runInSafe(() => getBlockExplorersURL(chainId, address, 'address')),
        [chainId, address],
    );

    if (addressLink) {
        return (
            <a
                href={addressLink}
                target="_blank"
                rel="noopener noreferrer"
                className={cn('text-highlight text-sm font-medium', bedStead.className)}
            >
                {formatAddress(address, 4)}
            </a>
        );
    }

    return (
        <span className={cn('text-highlight text-sm font-medium', bedStead.className)}>
            {formatAddress(address, 4)}
        </span>
    );
}
