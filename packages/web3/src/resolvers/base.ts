import urlcat from 'urlcat';

export interface NativeCurrency {
    id: string;
    chainId: number;
    type: 'Fungible';
    schema: string;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    logoURL?: string;
}

export interface ChainDescriptor {
    chainId: number;
    name: string;
    fullName?: string;
    shortName?: string;
    nativeCurrency: NativeCurrency;
    explorerUrl: {
        url: string;
        parameters?: Record<string, string | number | boolean>;
    };
    features?: string[];
}

export interface ExplorerOptions {
    addressPathname?: string;
    blockPathname?: string;
    transactionPathname?: string;
    domainPathname?: string;
    fungibleTokenPathname?: string;
    collectionPathname?: string;
}

export class ChainResolver {
    constructor(private readonly descriptors: () => readonly ChainDescriptor[]) {}

    private getDescriptor(chainId: number) {
        return this.descriptors().find((x) => x.chainId === chainId);
    }

    chainId(name: string) {
        if (!name) return;
        return this.descriptors().find((x) =>
            [x.name, x.fullName, x.shortName]
                .map((value) => value?.toLowerCase())
                .filter(Boolean)
                .includes(name.toLowerCase()),
        )?.chainId;
    }

    chainName(chainId: number) {
        return this.getDescriptor(chainId)?.name ?? 'Custom Network';
    }

    nativeCurrency(chainId: number): any {
        const descriptor = this.getDescriptor(chainId);
        if (!descriptor) throw new Error(`Unknown chainId: ${chainId}`);
        return descriptor.nativeCurrency;
    }

    isFeatureSupported(chainId: number, feature: string) {
        return !!this.getDescriptor(chainId)?.features?.includes(feature);
    }
}

export class ExplorerResolver {
    constructor(
        private readonly descriptors: () => readonly ChainDescriptor[],
        private readonly initial?: ExplorerOptions,
    ) {}

    private get options() {
        return {
            addressPathname: '/address/:address',
            blockPathname: '/block/:blockNumber',
            transactionPathname: '/tx/:id',
            domainPathname: '/address/:domain',
            fungibleTokenPathname: '/address/:address',
            collectionPathname: '/token/:address',
            ...this.initial,
        };
    }

    protected getExplorerURL(chainId: number) {
        return this.descriptors().find((x) => x.chainId === chainId)?.explorerUrl ?? { url: '' };
    }

    addressLink(chainId: number, address: string) {
        const explorerUrl = this.getExplorerURL(chainId);
        if (!explorerUrl.url || !address) return;
        return urlcat(explorerUrl.url, this.options.addressPathname, {
            address,
            ...explorerUrl.parameters,
        });
    }

    transactionLink(chainId: number, id: string) {
        const explorerUrl = this.getExplorerURL(chainId);
        if (!explorerUrl.url || !id) return;
        return urlcat(explorerUrl.url, this.options.transactionPathname, {
            id,
            ...explorerUrl.parameters,
        });
    }
}
