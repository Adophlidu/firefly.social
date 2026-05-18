import type { SocialSource, SocialSourceInURL } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { resolveHandle } from '@dimensiondev/workers-bsky-identity/resolveHandle.js';
import { attemptUntil } from '@dimensiondev/workers-shared/helpers/attemptUntil.js';
import { fetchFireflyEndpointRpc } from '@dimensiondev/workers-shared/helpers/fetchFireflyEndpointRpc.js';
import { fetchFireflyRpc } from '@dimensiondev/workers-shared/helpers/fetchFireflyRpc.js';
import { resolveSocialSource, resolveSocialSourceInUrl } from '@dimensiondev/workers-shared/helpers/resolveSource.js';
import type { FireflyPost } from '@dimensiondev/workers-shared/types/firefly.js';
import type { Context } from 'hono';

import {
    BSKY_POST_REGEXP,
    FARCASTER_DETAIL_REGEX,
    FIREFLY_DETAIL_REGEX,
    LENS_DETAIL_REGEX,
    TRUTH_SOCIAL_POST_REGEXP,
    TWEET_REGEX,
    TWEET_WEB_REGEX,
    WARPCAST_CONVERSATIONS_REGEX,
    WARPCAST_THREAD_REGEX,
} from '@/og/src/regexp.js';

function getPostById(source: SocialSource, postId: string, context: Context): Promise<FireflyPost | null> {
    return fetchFireflyRpc<FireflyPost | null>(
        resolveSocialSourceInUrl(source),
        'getPostById',
        {
            postId,
        },
        context,
    );
}

function getPostByShortId(shortId: string, handle: string, context: Context): Promise<FireflyPost | null> {
    return fetchFireflyEndpointRpc<FireflyPost | null>(
        'getPostByShortId',
        {
            shortId,
            handle,
            profileId: context.req.raw.headers.get('X-FARCASTER-ID'),
        },
        context,
    );
}

function getTruthSocialPostById(truthId: string, context: Context): Promise<FireflyPost | null> {
    return fetchFireflyEndpointRpc<FireflyPost | null>('getTruthSocialPostById', { truthId }, context);
}

export async function getPostFromUrl(postUrl: string, context: Context): Promise<FireflyPost | null> {
    return attemptUntil(
        [
            async () => {
                if (!TRUTH_SOCIAL_POST_REGEXP.test(postUrl)) return null;
                const matched = postUrl.match(TRUTH_SOCIAL_POST_REGEXP);
                const id = matched ? matched[2] : null;
                if (!id) return null;
                return getTruthSocialPostById(id, context);
            },
            async () => {
                if (!FIREFLY_DETAIL_REGEX.test(postUrl)) return null;
                const matched = postUrl.match(FIREFLY_DETAIL_REGEX);
                const source = matched ? matched[2] : null;
                const id = matched ? matched[3] : null;
                if (!id || !source) return null;
                return getPostById(resolveSocialSource(source as SocialSourceInURL), id, context);
            },
            async () => {
                if (!TWEET_REGEX.test(postUrl) && !TWEET_WEB_REGEX.test(postUrl)) return null;
                const matched = postUrl.match(TWEET_REGEX);
                const tweetWebMatch = postUrl.match(TWEET_WEB_REGEX);
                const id = matched ? matched[3] : tweetWebMatch ? tweetWebMatch[2] : null;
                if (!id) return null;
                return getPostById(Source.Twitter, id, context);
            },
            async () => {
                if (!LENS_DETAIL_REGEX.test(postUrl)) return null;
                const id = postUrl.match(/\/posts\/([^/]+)/)?.[1];
                if (!id) return null;
                return getPostById(Source.Lens, id, context);
            },
            async () => {
                if (!FARCASTER_DETAIL_REGEX.test(postUrl)) return null;
                const matched = postUrl.match(FARCASTER_DETAIL_REGEX);
                const handle = matched ? matched[1] : null;
                const id = matched ? matched[2] : null;
                if (!id) return null;
                if (id.length <= 10 && handle) return getPostByShortId(id, handle, context);
                return getPostById(Source.Farcaster, id, context);
            },
            async () => {
                if (!WARPCAST_CONVERSATIONS_REGEX.test(postUrl) && !WARPCAST_THREAD_REGEX.test(postUrl)) return null;
                const conversationsMatched = postUrl.match(WARPCAST_CONVERSATIONS_REGEX);
                const threadMatched = postUrl.match(WARPCAST_THREAD_REGEX);
                const id = conversationsMatched ? conversationsMatched[1] : threadMatched ? threadMatched[2] : null;
                if (!id) return null;
                const handle = threadMatched ? threadMatched[1] : null;
                if (id.length <= 10 && handle) return getPostByShortId(id, handle, context);
                return getPostById(Source.Farcaster, id, context);
            },
            async () => {
                if (!BSKY_POST_REGEXP.test(postUrl)) return null;
                const [, handle, postId] = postUrl.match(BSKY_POST_REGEXP) || [];
                if (!handle || !postId) return null;
                const did = await resolveHandle(handle, context);
                if (!did) return null;
                return getPostById(Source.Bsky, `${did.replace(/^did:plc:/, '')}_${postId}`, context);
            },
            async () => null,
        ],
        null,
        (x) => !x,
    );
}
