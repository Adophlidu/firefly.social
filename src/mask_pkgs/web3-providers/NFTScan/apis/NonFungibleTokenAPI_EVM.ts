import urlcat from 'urlcat';
import { type NonFungibleCollection } from '@masknet/web3-shared-base';
import { ChainId, type SchemaType, isValidChainId } from '@masknet/web3-shared-evm';
import { EVM, type Response } from '../types.js';
import { fetchFromNFTScanV2, createNonFungibleCollectionFromGroup } from '../helpers.js';
import type { BaseHubOptions, NonFungibleTokenAPI } from '../../entry-types.js';
import { createIndicator, createPageable, type Pageable, type PageIndicator } from '@/helpers/pageable.js';
import { EMPTY_LIST } from '@/constants/index.js';

class NFTScanNonFungibleTokenAPI_EVM implements NonFungibleTokenAPI.Provider<ChainId, SchemaType> {
    async getCollectionsByOwner(
        account: string,
        { chainId = ChainId.Mainnet, indicator }: BaseHubOptions<ChainId> = {},
    ): Promise<Pageable<NonFungibleCollection<ChainId, SchemaType>, PageIndicator>> {
        if (!isValidChainId(chainId)) return createPageable(EMPTY_LIST, createIndicator(indicator));
        const path = urlcat('/api/v2/account/own/all/:from', {
            from: account,
            erc_type: EVM.ErcType.ERC721,
            show_attribute: true,
        });
        const response = await fetchFromNFTScanV2<Response<EVM.AssetsGroup[]>>(chainId, path);
        const collections = response?.data.map((x) => createNonFungibleCollectionFromGroup(chainId, x)) ?? EMPTY_LIST;
        return createPageable(collections, createIndicator(indicator));
    }

    async getCollectionRaw(
        address: string,
        { chainId = ChainId.Mainnet }: BaseHubOptions<ChainId> = {},
    ): Promise<NonFungibleTokenAPI.Collection | undefined> {
        if (!isValidChainId(chainId)) return;
        const path = urlcat('/api/v2/collections/:address', {
            address,
        });
        const response = await fetchFromNFTScanV2<Response<NonFungibleTokenAPI.Collection>>(chainId, path);
        return response?.data;
    }
}
export const NFTScanNonFungibleTokenEVM = new NFTScanNonFungibleTokenAPI_EVM();
