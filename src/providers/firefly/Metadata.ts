import type { Metadata } from 'next';
import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveResponseData } from '@/providers/bsky/resolveResponseData.js';
import { settings } from '@/settings/index.js';
import type { ResponseJson } from '@/types/utility.js';

export function fetchMetadataApi(pathname: string, init?: RequestInit) {
    return fetchJson<ResponseJson<Metadata>>(urlcat(FIREFLY_WORKER_HOST, pathname), {
        ...init,
        headers: {
            ...init?.headers,
            'X-DEVELOPMENT-API': settings.dev ? 'true' : 'false',
        },
    });
}

class FireflyMetadata {
    async createArticleMetadata(articleId: string, pathname: string) {
        try {
            const response = await fetchMetadataApi(
                urlcat('/metadata/article', {
                    id: articleId,
                    pathname,
                }),
            );
            const metadata = resolveResponseData(response);
            return metadata;
        } catch (error) {
            return createSiteMetadata(pathname);
        }
    }

    async createEventMetadata(eventName: string, pathname: string) {
        try {
            const response = await fetchMetadataApi(
                urlcat('/metadata/event', {
                    name: eventName,
                    pathname,
                }),
            );
            const metadata = resolveResponseData(response);
            return metadata;
        } catch (error) {
            return createSiteMetadata(pathname);
        }
    }

    async createTransactionMetadata(chainId: number, hash: string, pathname: string) {
        try {
            const response = await fetchMetadataApi(
                urlcat('/metadata/transaction', {
                    chainId,
                    hash,
                    pathname,
                }),
            );
            const metadata = resolveResponseData(response);
            return metadata;
        } catch (error) {
            return createSiteMetadata(pathname);
        }
    }

    async createTokenMetadata(
        keyword: string,
        pathname: string,
        options?: {
            chainId?: number;
            address?: string;
            isCoinId?: boolean;
        },
    ) {
        try {
            const response = await fetchMetadataApi(
                urlcat('/metadata/token', {
                    keyword,
                    pathname,
                    ...options,
                }),
            );
            const metadata = resolveResponseData(response);
            return metadata;
        } catch (error) {
            return createSiteMetadata(pathname);
        }
    }

    async createNftMetadata(
        addressOrTokenId: string,
        chainIdOrCollectionId: string,
        tokenId: string,
        pathname: string,
    ) {
        try {
            const response = await fetchMetadataApi(
                urlcat('/metadata/nft', {
                    chainIdOrCollectionId,
                    addressOrTokenId,
                    tokenId,
                    pathname,
                }),
            );
            const metadata = resolveResponseData(response);
            return metadata;
        } catch (error) {
            return createSiteMetadata(pathname);
        }
    }

    async createNftCollectionMetadata(chainIdOrCollectionId: string, addressOrTokenId: string, pathname: string) {
        try {
            const response = await fetchMetadataApi(
                urlcat('/metadata/nft-collection', {
                    chainIdOrCollectionId,
                    addressOrTokenId,
                    pathname,
                }),
            );
            const metadata = resolveResponseData(response);
            return metadata;
        } catch (error) {
            return createSiteMetadata(pathname);
        }
    }

    async createFireflyProfileMetadata(source: string, pathname: string) {
        try {
            const response = await fetchMetadataApi(
                urlcat('/metadata/firefly-profile', {
                    source,
                    pathname,
                }),
            );
            const metadata = resolveResponseData(response);
            return metadata;
        } catch (error) {
            return createSiteMetadata(pathname);
        }
    }

    async createChannelMetadata(source: string, id: string, pathname: string) {
        try {
            const response = await fetchMetadataApi(
                urlcat('/metadata/channel', {
                    source,
                    id,
                    pathname,
                }),
            );
            const metadata = resolveResponseData(response);
            return metadata;
        } catch (error) {
            return createSiteMetadata(pathname);
        }
    }
}

export const FireflyMetadataProvider = new FireflyMetadata();
