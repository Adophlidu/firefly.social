import { PostType } from '@dimensiondev/enums';
import type { ApiContext } from '@dimensiondev/ssr';
import type { NextRequestContext } from '@dimensiondev/types';
import { compose, runInSafeAsync } from '@dimensiondev/utils';
import { pick } from 'lodash-es';
import type { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { TWITTER_TIMELINE_OPTIONS } from '@/constants/twitter.js';
import { createErrorResponseJson, createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { patchPostClientToFirefly } from '@/helpers/patchPostClientToFirefly.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { logger } from '@/libs/Logger.js';
import { attachRetweetedStatusToTweets } from '@/providers/twitter/attachRetweetedStatusToTweets.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { createTwitterErrorResponseJSON } from '@/providers/twitter/createTwitterErrorResponse.js';
import { tweetV2ToPost } from '@/providers/twitter/formatTwitterPost.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';

const ParamsSchema = z.object({ tweetId: z.string() });

const getHandler = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const { tweetId } = await getParamsWithZodSchema(ParamsSchema, context);

        const client = await createTwitterClientV2(request);
        const {
            data,
            includes = {},
            errors,
        } = await client.v2.singleTweet(tweetId, {
            ...TWITTER_TIMELINE_OPTIONS,
        });
        if (errors?.length) logger.error('[twitter] v2.singleTweet', errors);
        if (!data) return createErrorResponseJson('Post not found', { status: 404 });
        await attachRetweetedStatusToTweets(client, [data], includes);

        // The retweeted post may not receive attachment
        const retweeted = data.referenced_tweets?.find((tweet) => tweet.type === 'retweeted');
        if (retweeted) {
            const tweet = includes?.tweets?.find((x) => x.id === retweeted.id);
            if (tweet) {
                data.attachments = tweet.attachments;
                data.note_tweet = tweet.note_tweet;
                data.text = tweet.text;
                if (!includes.media) {
                    const result = await client.v2.singleTweet(tweet.id, {
                        ...pick(TWITTER_TIMELINE_OPTIONS, 'expansions', 'media.fields'),
                    });
                    if (result.includes?.media) includes.media = result.includes.media;
                }
            }
        }

        const post = await patchPostClientToFirefly(tweetV2ToPost(data, includes));
        const quoteOn = post.quoteOn;
        if (post.type === PostType.Quote && quoteOn) {
            const quoteTarget = await runInSafeAsync(() =>
                client.v2.singleTweet(quoteOn.postId, { ...TWITTER_TIMELINE_OPTIONS }),
            );
            if (quoteTarget?.data)
                await attachRetweetedStatusToTweets(client, [quoteTarget.data], quoteTarget.includes);
            post.quoteOn = await patchPostClientToFirefly(
                quoteTarget?.data ? tweetV2ToPost(quoteTarget.data, quoteTarget.includes) : quoteOn,
            );
        }

        // Handle Mirror's quoted post - fetch full media data for the quoted tweet
        const mirrorQuoteOn = post.mirrorOn?.quoteOn;
        if (post.type === PostType.Mirror && mirrorQuoteOn) {
            const quoteTarget = await runInSafeAsync(() =>
                client.v2.singleTweet(mirrorQuoteOn.postId, { ...TWITTER_TIMELINE_OPTIONS }),
            );
            if (quoteTarget?.data) {
                await attachRetweetedStatusToTweets(client, [quoteTarget.data], quoteTarget.includes);
                post.mirrorOn!.quoteOn = await patchPostClientToFirefly(
                    tweetV2ToPost(quoteTarget.data, quoteTarget.includes),
                );
                post.quoteOn = post.mirrorOn!.quoteOn;
            }
        }

        return createSuccessResponseJson(post);
    },
);

const deleteHandler = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request: NextRequest, context?: NextRequestContext) => {
        const { tweetId } = await getParamsWithZodSchema(ParamsSchema, context);

        const client = await createTwitterClientV2(request);
        const { data, errors } = await client.v2.deleteTweet(tweetId);

        if (errors?.length) {
            logger.error('[twitter] v2.deleteTweet', errors);
            return createTwitterErrorResponseJSON(errors);
        }

        return createSuccessResponseJson(data, { status: 200 });
    },
);

export function GET({ request, params }: ApiContext) {
    return getHandler(request as NextRequest, { params } as never);
}

export function DELETE({ request, params }: ApiContext) {
    return deleteHandler(request as NextRequest, { params } as never);
}
