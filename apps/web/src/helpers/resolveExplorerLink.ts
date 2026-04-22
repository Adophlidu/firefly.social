import { EthExplorerResolver } from '@dimensiondev/web3/resolvers';
import urlcat from 'urlcat';
import { base } from 'viem/chains';

const EXPLORER_CONFIG: Partial<Record<number, string>> = {
    [base.id]: 'https://sepolia.basescan.org',
};

export function resolveExplorerLink(chainId: number, id: string, type: 'address' | 'tx') {
    const fn = {
        address: EthExplorerResolver.addressLink.bind(EthExplorerResolver),
        tx: EthExplorerResolver.transactionLink.bind(EthExplorerResolver),
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
