import { ExplorerResolver as Resolver } from '@/web3-providers/base/ExplorerResolver.js';
import type { ChainDescriptor } from '@/web3-shared/base/specs.js';

class ExplorerResolver<ChainId, SchemaType, NetworkType> extends Resolver<ChainId, SchemaType, NetworkType> {
    constructor(
        descriptors: () => ReadonlyArray<ChainDescriptor<ChainId, SchemaType, NetworkType>>,
        initial?: ConstructorParameters<typeof Resolver>[1],
    ) {
        super(descriptors, initial);
    }

    protected override getExplorerURL() {
        return { url: 'https://blockscan.com' };
    }
}

export const BlockScanExplorerResolver = new ExplorerResolver(() => [], {
    fungibleTokenPathname: '/token/:address',
});
