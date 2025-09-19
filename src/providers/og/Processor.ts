import urlcat from 'urlcat';

import { Source } from '@/constants/enum.js';
import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import {
    BSKY_POST_REGEXP,
    FARCASTER_DETAIL_REGEX,
    FIREFLY_DETAIL_REGEX,
    LENS_DETAIL_REGEX,
    MIRROR_HOSTNAME_REGEXP,
    TRUTH_SOCIAL_POST_REGEXP,
    TWEET_REGEX,
    TWEET_WEB_REGEX,
    WARPCAST_CONVERSATIONS_REGEX,
    WARPCAST_THREAD_REGEX,
} from '@/constants/regexp.js';
import { attemptUntil } from '@/helpers/attemptUntil.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSocialSourceFromUrl } from '@/helpers/resolveSource.js';
import { convertBskyHandleToDid } from '@/providers/bsky/convertBskyHandleToDid.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { FireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import { getMirrorPayload } from '@/providers/og/readers/payload.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { type LinkDigested, type OpenGraph } from '@/types/og.js';
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

        if (MIRROR_HOSTNAME_REGEXP.test(url.hostname)) {
            return {
                og,
                payload: getMirrorPayload(document),
            };
        }

        return {
            og,
        };
    };

    digestPostUrl = async (postUrl: string): Promise<Post | null> => {
        return attemptUntil(
            [
                async () => {
                    if (!TRUTH_SOCIAL_POST_REGEXP.test(postUrl)) return null;
                    const match = postUrl.match(TRUTH_SOCIAL_POST_REGEXP);
                    const id = match ? match[2] : null;
                    if (!id) return null;
                    return FireflyEndpointProvider.getTruthSocialPostById(id);
                },
                async () => {
                    if (!FIREFLY_DETAIL_REGEX.test(postUrl)) return null;

                    const match = postUrl.match(FIREFLY_DETAIL_REGEX);

                    const source = match ? match[2] : null;
                    const id = match ? match[3] : null;
                    if (!id || !source) return null;
                    const provider = resolveSocialMediaProvider(resolveSocialSourceFromUrl(source));
                    return provider.getPostById(id);
                },

                async () => {
                    if (!TWEET_REGEX.test(postUrl) && !TWEET_WEB_REGEX.test(postUrl)) return null;
                    const match = postUrl.match(TWEET_REGEX);
                    const tweetWebMatch = postUrl.match(TWEET_WEB_REGEX);
                    const id = match ? match[3] : tweetWebMatch ? tweetWebMatch[2] : null;
                    if (!id) return null;
                    const provider = resolveSocialMediaProvider(Source.Twitter);
                    return provider.getPostById(id);
                },
                async () => {
                    if (!LENS_DETAIL_REGEX.test(postUrl)) return null;
                    const id = postUrl.match(/\/posts\/([^/]+)/)?.[1];
                    if (!id) return null;
                    const provider = resolveSocialMediaProvider(Source.Lens);
                    return provider.getPostById(id);
                },
                async () => {
                    if (!FARCASTER_DETAIL_REGEX.test(postUrl)) return null;
                    const match = postUrl.match(FARCASTER_DETAIL_REGEX);
                    const handle = match ? match[1] : null;
                    const id = match ? match[2] : null;
                    if (!id) return null;
                    if (id.length <= 10 && handle) return FireflySocialMediaProvider.getPostByShortId(id, handle);
                    const provider = resolveSocialMediaProvider(Source.Farcaster);
                    return provider.getPostById(id);
                },
                async () => {
                    if (!WARPCAST_CONVERSATIONS_REGEX.test(postUrl) && !WARPCAST_THREAD_REGEX.test(postUrl))
                        return null;

                    const conversationsMatch = postUrl.match(WARPCAST_CONVERSATIONS_REGEX);
                    const threadMatch = postUrl.match(WARPCAST_THREAD_REGEX);
                    const id = conversationsMatch ? conversationsMatch[1] : threadMatch ? threadMatch[2] : null;
                    const handle = threadMatch ? threadMatch[1] : null;
                    if (!id) return null;
                    const provider = resolveSocialMediaProvider(Source.Farcaster);
                    if (id.length <= 10 && handle) return FireflySocialMediaProvider.getPostByShortId(id, handle);
                    return provider.getPostById(id);
                },
                async () => {
                    if (BSKY_POST_REGEXP.test(postUrl)) return null;
                    const [, handle, postId] = postUrl.match(BSKY_POST_REGEXP) || [];
                    if (!handle || !postId) return null;
                    const did = await convertBskyHandleToDid(handle);
                    if (!did) return null;
                    const provider = resolveSocialMediaProvider(Source.Bsky);
                    return provider.getPostById(`${did.replace(/^did:plc:/, '')}_${postId}`);
                },
            ],
            null,
            (x) => !x,
        );
    };
}

export const OpenGraphProcessor = new Processor();
