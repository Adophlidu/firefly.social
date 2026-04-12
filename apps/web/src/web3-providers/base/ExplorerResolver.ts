import urlcat from 'urlcat';

import type { ChainDescriptor } from '@/web3-shared/base/specs.js';

interface ExplorerOptions {
    addressPathname?: string;
    blockPathname?: string;
    transactionPathname?: string;
    domainPathname?: string;
    fungibleTokenPathname?: string;
    nonFungibleTokenPathname?: string;
}

export class ExplorerResolver<ChainId, SchemaType, NetworkType> {
    constructor(
        private descriptors: () => ReadonlyArray<ChainDescriptor<ChainId, SchemaType, NetworkType>>,
        private initial?: ExplorerOptions,
    ) {}
    private get options() {
        const defaults = {
            addressPathname: '/address/:address',
            blockPathname: '/block/:blockNumber',
            transactionPathname: '/tx/:id',
            domainPathname: '/address/:domain',
            fungibleTokenPathname: '/address/:address',
            nonFungibleTokenPathname: '/nft/:address/:tokenId',
            collectionPathname: '/token/:address',
        };
        return {
            ...defaults,
            ...this.initial,
        };
    }

    protected getExplorerURL(chainId: ChainId) {
        const chainDescriptor = this.descriptors().find((x) => x.chainId === chainId);
        return chainDescriptor?.explorerUrl ?? { url: '' };
    }

    addressLink(chainId: ChainId, address: string) {
        const explorerUrl = this.getExplorerURL(chainId);
        if (!explorerUrl.url || !address) return;
        return urlcat(explorerUrl.url, this.options.addressPathname, {
            address,
            ...explorerUrl.parameters,
        });
    }

    transactionLink(chainId: ChainId, id: string) {
        const explorerUrl = this.getExplorerURL(chainId);
        if (!explorerUrl.url) return;

        return urlcat(explorerUrl.url, this.options.transactionPathname, {
            id,
            ...explorerUrl.parameters,
        });
    }
}
