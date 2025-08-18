import { pick } from 'lodash-es';
import type { NextRequest } from 'next/server.js';

import { MalformedError } from '@/constants/error.js';
import { TWITTER_TIMELINE_OPTIONS } from '@/constants/twitter.js';
import { compose } from '@/helpers/compose.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { patchPostClientToFirefly } from '@/helpers/patchPostClientToFirefly.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { createTwitterErrorResponseJSON } from '@/providers/twitter/createTwitterErrorResponse.js';
import { tweetV2ToPost } from '@/providers/twitter/formatTwitterPost.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import type { NextRequestContext } from '@/types/utility.js';

export const DELETE = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request: NextRequest, context?: NextRequestContext) => {
        const tweetId = (await context?.params)?.tweetId;
        if (!tweetId) throw new MalformedError('tweetId not found');

        const client = await createTwitterClientV2();
        const { data, errors } = await client.v2.deleteTweet(tweetId);

        if (errors?.length) {
            console.error('[twitter] v2.deleteTweet', errors);
            return createTwitterErrorResponseJSON(errors);
        }

        return createSuccessResponseJson(data, { status: 200 });
    },
);

export const GET = compose<(request: NextRequest, context?: NextRequestContext) => Promise<Response>>(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const tweetId = (await context?.params)?.tweetId;
        if (!tweetId) throw new MalformedError('tweetId not found');

        const client = await createTwitterClientV2();
        const {
            data,
            includes = {},
            errors,
        } = await client.v2.singleTweet(tweetId, {
            ...TWITTER_TIMELINE_OPTIONS,
        });
        if (errors?.length) console.error('[twitter] v2.singleTweet', errors);

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
        if (post.type === 'Quote' && quoteOn) {
            const quoteTarget = await runInSafeAsync(() =>
                client.v2.singleTweet(quoteOn.postId, { ...TWITTER_TIMELINE_OPTIONS }),
            );
            post.quoteOn = await patchPostClientToFirefly(
                quoteTarget?.data ? tweetV2ToPost(quoteTarget.data, quoteTarget.includes) : quoteOn,
            );
        }

        return createSuccessResponseJson(post);
    },
);
