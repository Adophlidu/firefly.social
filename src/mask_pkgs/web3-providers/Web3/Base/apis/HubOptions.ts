import { identity, pickBy } from 'lodash-es';
import { CurrencyType, type SourceType } from '@masknet/web3-shared-base';
import { type SchemaType } from '@masknet/web3-shared-evm';
import type { PageIndicator } from '@/helpers/pageable.js';
import type { NetworkPluginID } from '@/constants/enum.js';
import type { PartialRequired } from '@/types/index.js';

export interface BaseHubOptions<ChainId, Indicator = PageIndicator> {
    /** The user account as the API parameter */
    account?: string;
    /** The chain id as the API parameter */
    chainId?: ChainId;
    /** The networkPluginID as the API parameter */
    networkPluginId?: NetworkPluginID;
    /** The id of data provider */
    sourceType?: SourceType;
    /** The schema type of filtered data */
    schemaType?: SchemaType;
    /** The currency type of data */
    currencyType?: CurrencyType;
    /** The item size of each page. */
    size?: number;
    /** The page index. */
    indicator?: Indicator;
    allChains?: boolean;
}

export abstract class HubOptionsProvider<ChainId> {
    constructor(private options?: BaseHubOptions<ChainId>) {}
    protected abstract getDefaultChainId(): ChainId;
    protected abstract getNetworkPluginID(): NetworkPluginID;

    protected get defaults(): PartialRequired<BaseHubOptions<ChainId>, 'account' | 'chainId'> {
        return {
            account: '',
            chainId: this.getDefaultChainId(),
            networkPluginId: this.getNetworkPluginID(),
            currencyType: CurrencyType.USD,
            size: 50,
        };
    }

    protected get refs(): BaseHubOptions<ChainId> {
        return {
            currencyType: CurrencyType.USD,
        };
    }

    fill(initial?: BaseHubOptions<ChainId>): PartialRequired<BaseHubOptions<ChainId>, 'account' | 'chainId'> {
        return {
            ...this.defaults,
            ...this.refs,
            ...this.options,
            ...pickBy(initial, identity),
        };
    }
}
