import { EthereumChainId, type EthereumSchemaType } from '@masknet/web3-shared-evm';
import urlcat from 'urlcat';

import { EMPTY_LIST } from '@/constants/index.js';
import { isValidChainIdEthereum } from '@/helpers/isValidChainId.js';
import { createIndicator, createPageable, type Pageable, type PageIndicator } from '@/helpers/pageable.js';
import type { BaseHubOptions, NonFungibleTokenAPI } from '@/mask_pkgs/web3-providers/entry-types.js';
import {
    createNonFungibleCollectionFromGroup,
    fetchFromNFTScanV2,
} from '@/mask_pkgs/web3-providers/NFTScan/helpers.js';
import { EVM, type Response } from '@/mask_pkgs/web3-providers/NFTScan/types.js';
import type { NonFungibleCollection } from '@/mask_pkgs/web3-shared/base/index.js';

class NFTScanNonFungibleTokenAPI_EVM implements NonFungibleTokenAPI.Provider<EthereumChainId, EthereumSchemaType> {
    async getCollectionsByOwner(
        account: string,
        { chainId = EthereumChainId.Mainnet, indicator }: BaseHubOptions<EthereumChainId> = {},
    ): Promise<Pageable<NonFungibleCollection<EthereumChainId, EthereumSchemaType>, PageIndicator>> {
        if (!isValidChainIdEthereum(chainId)) return createPageable(EMPTY_LIST, createIndicator(indicator));
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
        { chainId = EthereumChainId.Mainnet }: BaseHubOptions<EthereumChainId> = {},
    ): Promise<NonFungibleTokenAPI.Collection | undefined> {
        if (!isValidChainIdEthereum(chainId)) return;
        const path = urlcat('/api/v2/collections/:address', {
            address,
        });
        const response = await fetchFromNFTScanV2<Response<NonFungibleTokenAPI.Collection>>(chainId, path);
        return response?.data;
    }
}
export const NFTScanNonFungibleTokenEVM = new NFTScanNonFungibleTokenAPI_EVM();
