import urlcat from 'urlcat';

import { SourceInURL } from '@/constants/enum.js';
import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import {
    FARCASTER_DETAIL_REGEX,
    FIREFLY_DETAIL_REGEX,
    LENS_DETAIL_REGEX,
    MIRROR_HOSTNAME_REGEXP,
    TWEET_REGEX,
    TWEET_WEB_REGEX,
    WARPCAST_CONVERSATIONS_REGEX,
    WARPCAST_THREAD_REGEX,
} from '@/constants/regexp.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import { resolveSocialSourceFromUrl } from '@/helpers/resolveSource.js';
import { resolveSocialSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { getFarcasterPayload, getMirrorPayload } from '@/providers/og/readers/payload.js';
import { type LinkDigested, type OpenGraph, PayloadType } from '@/types/og.js';
import type { ResponseJson } from '@/types/utility.js';

class Processor {
    digestDocumentUrl = async (documentUrl: string, signal?: AbortSignal): Promise<LinkDigested | null> => {
        const url = parseUrl(documentUrl);
        if (!url) return null;

        const response = await fetchJson<ResponseJson<{ og: OpenGraph }>>(
            urlcat(FIREFLY_WORKER_HOST, '/oembed', {
                link: url.toString(),
            }),
            {
                signal,
            },
        );
        if (!response.success) return null;

        const { og } = response.data;

        if (TWEET_REGEX.test(documentUrl)) {
            const match = documentUrl.match(TWEET_REGEX);
            const id = match ? match[3] : null;
            if (!id) return { og };
            return {
                og,
                payload: {
                    type: PayloadType.Post,
                    id,
                    source: SourceInURL.Twitter,
                },
            };
        }

        if (TWEET_WEB_REGEX.test(documentUrl)) {
            const match = documentUrl.match(TWEET_WEB_REGEX);
            const id = match ? match[2] : null;
            if (!id) return { og };
            return {
                og,
                payload: {
                    type: PayloadType.Post,
                    id,
                    source: SourceInURL.Twitter,
                },
            };
        }

        if (MIRROR_HOSTNAME_REGEXP.test(url.hostname)) {
            return {
                og,
                payload: getMirrorPayload(document),
            };
        }
        if (WARPCAST_THREAD_REGEX.test(documentUrl) || WARPCAST_CONVERSATIONS_REGEX.test(documentUrl)) {
            return {
                og,
                payload: getFarcasterPayload(document),
            };
        }
        if (LENS_DETAIL_REGEX.test(documentUrl)) {
            const id = documentUrl.match(/\/posts\/([^/]+)/)?.[1];
            if (!id) return { og };
            return {
                og,
                payload: {
                    type: PayloadType.Post,
                    id,
                    source: SourceInURL.Lens,
                },
            };
        }
        if (FARCASTER_DETAIL_REGEX.test(documentUrl)) {
            const match = documentUrl.match(FARCASTER_DETAIL_REGEX);
            const id = match ? match[2] : null;
            if (!id) return { og };
            return {
                og,
                payload: {
                    type: PayloadType.Post,
                    id,
                    source: SourceInURL.Farcaster,
                },
            };
        }

        if (FIREFLY_DETAIL_REGEX.test(documentUrl)) {
            const match = documentUrl.match(FIREFLY_DETAIL_REGEX);
            const source = match ? match[2] : null;
            const id = match ? match[3] : null;
            if (!id || !source) return { og };
            return {
                og,
                payload: {
                    type: PayloadType.Post,
                    id,
                    source: resolveSocialSourceInUrl(resolveSocialSourceFromUrl(source)),
                },
            };
        }

        return {
            og,
        };
    };
}

export const OpenGraphProcessor = new Processor();
