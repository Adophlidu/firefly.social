import { attemptUntil, type NonFungibleCollection } from '@masknet/web3-shared-base';
import { type Pageable, createPageable, createIndicator, EMPTY_LIST } from '@masknet/shared-base';
import { AbstractBaseHubProvider } from './HubProvider.js';
import type { BaseHubOptions } from './HubOptions.js';
import type { NonFungibleTokenAPI } from '../../../entry-types.js';

export abstract class BaseHubNonFungible<ChainId, SchemaType> extends AbstractBaseHubProvider<ChainId> {
    protected abstract getProvidersNonFungible(
        initial?: BaseHubOptions<ChainId>,
    ): Array<NonFungibleTokenAPI.Provider<ChainId, SchemaType>>;

    async getNonFungibleCollectionsByOwner(
        account: string,
        initial?: BaseHubOptions<ChainId>,
    ): Promise<Pageable<NonFungibleCollection<ChainId, SchemaType>>> {
        const options = this.HubOptions.fill(initial);
        const providers = this.getProvidersNonFungible(initial);
        return attemptUntil(
            providers.map((x) => () => x.getCollectionsByOwner?.(account, options)),
            createPageable(EMPTY_LIST, createIndicator(options.indicator)),
        );
    }
}
