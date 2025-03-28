import { type EthereumSchemaType } from '@masknet/web3-shared-evm';

import { CurrencyType, type NetworkPluginID } from '@/constants/enum.js';
import type { PageIndicator } from '@/helpers/pageable.js';
import type { SourceType } from '@/mask_pkgs/web3-shared/base/index.js';

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
    schemaType?: EthereumSchemaType;
    /** The currency type of data */
    currencyType?: CurrencyType;
    /** The item size of each page. */
    size?: number;
    /** The page index. */
    indicator?: Indicator;
    allChains?: boolean;
}
