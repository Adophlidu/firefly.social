import { compact } from 'lodash-es';
import urlcat from 'urlcat';

import { EMPTY_LIST } from '@/constants/index.js';
import { adjustAssetUris } from '@/helpers/adjustAssetUris.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fixCollection } from '@/providers/firefly/endpoint/fixCollection.js';
import { NFTSCAN_CHAIN_IDS } from '@/providers/nft-scan/constants.js';
import {
    type CollectionItemsResponse,
    type CollectionResponse,
    type CollectionsResponse,
    type CollectionStatisticsResponse,
    type HoldersResponse,
    type NFTDetailsResponse,
    type TrendingNFTsResponse,
} from '@/providers/types/Firefly.js';
import type {
    NFTDetailResponse,
    PoapDetailResponse,
    PoapHoldersResponse,
    PoapResponse,
} from '@/providers/types/NFTs.js';
import { settings } from '@/settings/index.js';

class FireflyNft {
    async getPOAPs(wallet: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/wallet/poap', {
            walletAddress: wallet,
        });
        const response = await fetchJson<PoapResponse>(url);
        return response.data;
    }

    async getPOAP(tokenId: string) {
        // cspell:ignore tokenid
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/poap/detail_by_tokenid', {
            tokenId,
        });
        const response = await fetchJson<PoapDetailResponse>(url);
        return response.data;
    }

    async getPoapHolders(eventId: string, indicator?: PageIndicator) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/poap/holder', {
            eventId,
            limit: 20,
            offset: indicator?.id || undefined,
        });
        const response = await fetchJson<PoapHoldersResponse>(url);
        const nextOffset = response.data.tokens.length ? response.data.limit + response.data.offset : undefined;
        return createPageable(
            response.data.tokens,
            indicator,
            nextOffset ? createNextIndicator(indicator, nextOffset.toString()) : undefined,
        );
    }

    async getPoapHolderCount(eventId: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/poap/holder', {
            eventId,
        });
        const response = await fetchJson<PoapHoldersResponse>(url);
        return response.data.total;
    }

    async getNFTDetails(chainId: number, list: Array<{ contract_address: string; token_id: string }>) {
        if (!list.length || !NFTSCAN_CHAIN_IDS.includes(chainId)) return [];
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/detail');
        const response = await fetchJson<NFTDetailResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                chainId,
                list,
            }),
        });
        return response.data.map(adjustAssetUris);
    }

    async getNFTDetail(chainId: number, contractAddress: string, tokenId: string) {
        const nfts = await this.getNFTDetails(chainId, [{ contract_address: contractAddress, token_id: tokenId }]);
        return nfts[0];
    }

    async getCollection(chainId: number, contractAddress: string) {
        if (!NFTSCAN_CHAIN_IDS.includes(chainId)) return null;
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/collection', {
            chainId,
            contractAddress,
        });
        const response = await fetchJson<CollectionResponse>(url);
        if (!response.data) return null;
        if ('chain_id' in response.data && Object.keys(response.data).length <= 1) return null;
        return fixCollection(response.data);
    }

    async detectCollection(address: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/detect', {
            address,
        });
        const response = await fetchJson<CollectionResponse>(url);
        if (!response.data) return null;
        return fixCollection(response.data);
    }

    async getCollectionItems(chainId: number, contractAddress: string, indicator?: PageIndicator) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/collection/items', {
            chainId,
            contractAddress,
            cursor: indicator?.id,
        });
        const response = await fetchJson<CollectionItemsResponse>(url);
        const list = (response.data?.content || []).map(adjustAssetUris);
        return createPageable(
            list,
            createIndicator(indicator),
            response.data?.next ? createNextIndicator(indicator, response.data.next) : undefined,
        );
    }

    async getCollections(list: Array<{ contractAddress: string; chainId: number }>) {
        const promises = list.map(async ({ contractAddress, chainId }) => {
            return this.getCollection(chainId, contractAddress);
        });
        const results = await Promise.allSettled(promises);
        return compact(results.map((x) => (x.status === 'fulfilled' ? x.value : null))).map(fixCollection);
    }

    async getUserCollections(chainId: number, walletAddress: string, indicator?: PageIndicator) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/wallet/own/collection', {
            chainId,
            walletAddress,
            cursor: indicator?.id,
        });
        const response = await fetchJson<CollectionsResponse>(url);
        const collections = (response.data?.collections || []).map(fixCollection);
        return createPageable(
            collections,
            createIndicator(indicator),
            response.data?.cursor && collections.length
                ? createNextIndicator(indicator, response.data.cursor)
                : undefined,
        );
    }

    async getUserCollectionNFTs(
        walletAddress: string,
        chainId: number,
        contractAddress: string,
        indicator?: PageIndicator,
    ) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/wallet/own', {
            walletAddress,
            chainId,
            contractAddress,
            cursor: indicator?.id,
        });
        const response = await fetchJson<NFTDetailsResponse>(url);
        const list = (response.data?.nfts || []).map(adjustAssetUris);
        return createPageable(
            list,
            createIndicator(indicator),
            response.data?.cursor ? createNextIndicator(indicator, response.data.cursor) : undefined,
        );
    }

    async getCollectionHolders(chainId: number, contractAddress: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/collection/holder', {
            chainId,
            contractAddress,
            size: 100,
        });
        const response = await fetchJson<HoldersResponse>(url);
        return response.data || EMPTY_LIST;
    }

    async getCollectionStatistics(chainId: number, contractAddress: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/collection/statistics', {
            chainId,
            contractAddress,
        });
        const response = await fetchJson<CollectionStatisticsResponse>(url);
        return response.data;
    }

    async getTrendingNFTs(size = 20) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/trending', { size });
        const response = await fetchJson<TrendingNFTsResponse>(url);
        return resolveFireflyResponseData(response);
    }
}

export { FireflyNft };
export const fireflyNftProvider = new FireflyNft();

// Export fixCollection for use in other modules
export { fixCollection };
