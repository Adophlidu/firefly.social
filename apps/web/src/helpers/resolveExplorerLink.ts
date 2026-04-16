import urlcat from 'urlcat';
import { base } from 'viem/chains';

import { EVMExplorerResolver } from '@/web3-providers/evm/ResolverAPI.js';

const EXPLORER_CONFIG: Partial<Record<number, string>> = {
    [base.id]: 'https://sepolia.basescan.org',
};

export function resolveExplorerLink(chainId: number, id: string, type: 'address' | 'tx') {
    const fn = {
        address: EVMExplorerResolver.addressLink.bind(EVMExplorerResolver),
        tx: EVMExplorerResolver.transactionLink.bind(EVMExplorerResolver),
    }[type];

    const url = fn(chainId, id);
    if (!url && EXPLORER_CONFIG[chainId]) {
        return urlcat(EXPLORER_CONFIG[chainId], `/:type/:id`, {
            type,
            id,
        });
    }
    return url;
}
