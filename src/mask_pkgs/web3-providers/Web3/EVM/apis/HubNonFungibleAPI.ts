import { SourceType } from '@masknet/web3-shared-base';
import { type ChainId, type SchemaType } from '@masknet/web3-shared-evm';
import { BaseHubNonFungible } from '../../Base/apis/HubNonFungible.js';
import { EVMHubOptionsProvider } from './HubOptionsAPI.js';
import type { EVMHubOptions } from '../types/index.js';
import type { NonFungibleTokenAPI } from '../../../entry-types.js';
import * as NFTScanNonFungibleTokenEVM from /* webpackDefer: true */ '../../../NFTScan/index.js';
import * as SimpleHashEVM from /* webpackDefer: true */ '../../../SimpleHash/index.js';

export class HubNonFungibleAPI extends BaseHubNonFungible<ChainId, SchemaType> {
    protected override HubOptions = new EVMHubOptionsProvider(this.options);

    protected override getProvidersNonFungible(initial?: EVMHubOptions) {
        const options = this.HubOptions.fill(initial);
        return this.getPredicateProviders<NonFungibleTokenAPI.Provider<ChainId, SchemaType>>(
            {
                [SourceType.NFTScan]: NFTScanNonFungibleTokenEVM.NFTScanNonFungibleTokenEVM,
                [SourceType.SimpleHash]: SimpleHashEVM.SimpleHashEVM,
            },
            [SimpleHashEVM.SimpleHashEVM, NFTScanNonFungibleTokenEVM.NFTScanNonFungibleTokenEVM],
            initial,
        );
    }
}
