import urlcat from 'urlcat';
import {
    EMPTY_LIST,
    createPageable,
    type Pageable,
    type PageIndicator,
    createIndicator,
    NetworkPluginID,
} from '@masknet/shared-base';
import { type NonFungibleCollection } from '@masknet/web3-shared-base';
import { ChainId, SchemaType, isValidChainId } from '@masknet/web3-shared-evm';
import {
    fetchFromSimpleHash,
    resolveChain,
    createNonFungibleCollection,
    resolveChainId,
    getAllChainNames,
    isLensFollower,
} from '../helpers.js';
import type { BaseHubOptions, NonFungibleTokenAPI } from '../../entry-types.js';
import { SPAM_SCORE } from '../constants.js';
import { type SimpleHash } from '../../types/SimpleHash.js';

class SimpleHashAPI_EVM implements NonFungibleTokenAPI.Provider<ChainId, SchemaType> {
    async getCollectionsByOwner(
        account: string,
        { chainId, indicator, allChains, schemaType }: BaseHubOptions<ChainId> = {},
    ): Promise<Pageable<NonFungibleCollection<ChainId, SchemaType>, PageIndicator>> {
        const pluginId = NetworkPluginID.PLUGIN_EVM;
        const isERC712Only = schemaType === SchemaType.ERC721;
        const chain = allChains || !chainId ? getAllChainNames(pluginId) : resolveChain(pluginId, chainId);
        if (!chain || !account) {
            return createPageable(EMPTY_LIST, createIndicator(indicator));
        }

        const path = urlcat('/api/v0/nfts/collections_by_wallets', {
            chains: chain,
            wallet_addresses: account,
            nft_ids: 1,
        });

        const response = await fetchFromSimpleHash<{ collections: SimpleHash.Collection[] }>(path);

        const filteredCollections = response.collections
            // Might got bad data responded including id field and other fields empty
            .filter((x) => {
                if (!x.id || (x.spam_score !== null && x.spam_score >= SPAM_SCORE)) return false;
                return (
                    isValidChainId(resolveChainId(x.chain)) &&
                    x.top_contracts.length > 0 &&
                    (!isLensFollower(x.name) || !isERC712Only)
                );
            });

        let erc721CollectionIdList: string[] = EMPTY_LIST;

        if (isERC712Only) {
            const nftIdList = filteredCollections.map((x) => x.nft_ids?.[0] || '').filter(Boolean);
            while (nftIdList.length) {
                const batchAssetsPath = urlcat('/api/v0/nfts/assets', {
                    nft_ids: nftIdList.splice(0, 50).join(','),
                });

                const batchAssetsResponse = await fetchFromSimpleHash<{
                    nfts: SimpleHash.Asset[];
                }>(batchAssetsPath);

                erc721CollectionIdList = erc721CollectionIdList.concat(
                    batchAssetsResponse.nfts
                        .filter((x) => x.contract.type === 'ERC721')
                        .map((x) => x.collection.collection_id),
                );
            }
        }

        const collections = filteredCollections
            .filter((x) => !isERC712Only || erc721CollectionIdList.includes(x.id))
            .map((x) => createNonFungibleCollection(x));

        return createPageable(collections, createIndicator(indicator));
    }
}
export const SimpleHashEVM = new SimpleHashAPI_EVM();
