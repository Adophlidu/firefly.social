import urlcat from 'urlcat';
import { EMPTY_LIST, createIndicator, createPageable, type PageIndicator, type Pageable } from '@masknet/shared-base';
import { type NonFungibleCollection } from '@masknet/web3-shared-base';
import { ChainId, isValidChainId, type SchemaType } from '@masknet/web3-shared-solana';
import { fetchFromSimpleHash } from '../helpers.js';
import type { BaseHubOptions, NonFungibleTokenAPI } from '../../entry-types.js';
import { createSolanaNonFungibleCollection, resolveSolanaChainId } from '../solana-helpers.js';
import { SPAM_SCORE } from '../constants.js';
import type { SimpleHash } from '../../types/SimpleHash.js';

class SimpleHashAPI_Solana implements NonFungibleTokenAPI.Provider<ChainId, SchemaType> {
    async getCollectionsByOwner(
        account: string,
        { chainId, indicator }: BaseHubOptions<ChainId> = {},
    ): Promise<Pageable<NonFungibleCollection<ChainId, SchemaType>, PageIndicator>> {
        if (!account || !isValidChainId(chainId)) {
            return createPageable(EMPTY_LIST, createIndicator(indicator));
        }

        const path = urlcat('/api/v0/nfts/collections_by_wallets', {
            chains: 'solana',
            wallet_addresses: account,
        });

        const response = await fetchFromSimpleHash<{ collections: SimpleHash.Collection[] }>(path);

        const collections = response.collections
            // Might got bad data responded including id field and other fields empty
            .filter((x) => {
                return (
                    x.id &&
                    isValidChainId(resolveSolanaChainId(x.chain)) &&
                    (x.spam_score === null || x.spam_score <= SPAM_SCORE)
                );
            })
            .map((x) => createSolanaNonFungibleCollection(x));

        return createPageable(collections, createIndicator(indicator));
    }
}
export const SimpleHashSolana = new SimpleHashAPI_Solana();
