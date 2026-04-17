import { ChainConfigMismatchError } from '@/constants/error.js';
import type { ChainDescriptor } from '@/web3-shared/base/specs.js';

export class ChainResolver<ChainId, SchemaType> {
    constructor(private readonly descriptors: () => ReadonlyArray<ChainDescriptor<ChainId, SchemaType>>) {}
    private getDescriptor(chainId: ChainId) {
        return this.descriptors().find((x) => x.chainId === chainId);
    }

    private getDescriptorRequired(chainId: ChainId) {
        const descriptor = this.getDescriptor(chainId);
        if (!descriptor)
            throw new ChainConfigMismatchError(
                `Unknown chainId: ${chainId}. It might too early to access network state.`,
            );
        return descriptor;
    }

    /**
     * Guess chain id by name, it's not perfectly accurate
     */
    chainId(name: string) {
        if (!name) return;
        return this.descriptors().find((x) =>
            [x.name, x.fullName, x.shortName]
                .map((x) => x?.toLowerCase())
                .filter(Boolean)
                .includes(name.toLowerCase()),
        )?.chainId;
    }
    chainName(chainId: ChainId) {
        return this.getDescriptor(chainId)?.name ?? 'Custom Network';
    }
    nativeCurrency(chainId: ChainId) {
        return this.getDescriptorRequired(chainId).nativeCurrency;
    }
    isFeatureSupported(chainId: ChainId, feature: string) {
        return !!this.getDescriptor(chainId)?.features?.includes(feature);
    }
}
