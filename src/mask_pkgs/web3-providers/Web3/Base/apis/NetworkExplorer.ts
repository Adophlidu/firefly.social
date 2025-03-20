import type { NetworkDescriptor } from '@masknet/web3-shared-base';

export class NetworkResolver<ChainId, NetworkType> {
    constructor(private descriptors: () => ReadonlyArray<NetworkDescriptor<ChainId, NetworkType>>) {}

    networkChainId(networkType: NetworkType) {
        return this.descriptors().find((x) => x.type === networkType)?.chainId;
    }
}
