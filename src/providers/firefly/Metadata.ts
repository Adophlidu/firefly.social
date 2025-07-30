import type { Metadata } from 'next';
import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveResponseData } from '@/providers/bsky/resolveResponseData.js';
import type { ResponseJson } from '@/types/index.js';

class FireflyMetadata {
    async createArticleMetadata(articleId: string, pathname: string) {
        try {
            const response = await fetchJson<ResponseJson<Metadata>>(
                urlcat(FIREFLY_WORKER_HOST, '/metadata/article', {
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
            const response = await fetchJson<ResponseJson<Metadata>>(
                urlcat(FIREFLY_WORKER_HOST, '/metadata/event', {
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
}

export const FireflyMetadataProvider = new FireflyMetadata();
