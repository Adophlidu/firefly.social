import { compose } from '@dimensiondev/utils';
import { type SendTweetV2Params } from 'twitter-api-v2';
import { z } from 'zod';

import { POLL_PEER_OPTION_MAX_CHARS } from '@/constants/poll.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getJsonBodyWithZodSchema } from '@/helpers/getJsonBodyWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { logger } from '@/libs/Logger.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { createTwitterErrorResponseJSON } from '@/providers/twitter/createTwitterErrorResponse.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';

const TweetSchema = z.object({
    text: z.string(),
    replySettings: z.enum(['following', 'mentionedUsers']).optional(),
    excludeReplyProfileIds: z.array(z.string()).max(100, 'Maximum 100 exclude reply profile ids allowed').optional(),
    quoteTwitterId: z.string().optional(),
    inReplyToTweetId: z.string().optional(),
    mediaIds: z.array(z.string()).max(10, 'Maximum 10 media ids allowed').optional(),
    poll: z
        .object({
            options: z.array(
                z.object({
                    label: z
                        .string()
                        .max(
                            POLL_PEER_OPTION_MAX_CHARS,
                            `Poll option must be less than ${POLL_PEER_OPTION_MAX_CHARS} characters`,
                        ),
                }),
            ),
            durationSeconds: z.number().int().positive(),
        })
        .optional(),
});

async function composeTweet(tweet: z.infer<typeof TweetSchema>) {
    if (!tweet?.text && !tweet?.mediaIds?.length) throw new Error('Tweet must contain text or media');

    const composedTweet: SendTweetV2Params = {
        text: tweet.text,
    };

    if (tweet.mediaIds?.length) {
        composedTweet.media = {
            // force skip type check
            media_ids: tweet.mediaIds as [string],
        };
    }

    if (tweet.inReplyToTweetId) {
        composedTweet.reply = {
            in_reply_to_tweet_id: tweet.inReplyToTweetId,
            exclude_reply_user_ids: tweet.excludeReplyProfileIds,
        };
    }

    if (tweet.replySettings) {
        composedTweet.reply_settings = tweet.replySettings;
    }

    if (tweet.quoteTwitterId) {
        composedTweet.quote_tweet_id = tweet.quoteTwitterId;
    }

    if (tweet.poll) {
        composedTweet.poll = {
            options: tweet.poll.options.map((option) => option.label),
            duration_minutes: Math.floor(tweet.poll.durationSeconds / 60),
        };
    }

    return composedTweet;
}

export const POST = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const body = await getJsonBodyWithZodSchema(request, TweetSchema);
        const client = await createTwitterClientV2();
        const tweet = await composeTweet(body);
        const { data, errors } = await client.v2.tweet(tweet);
        if (errors?.length) {
            logger.error('[twitter] v2.tweet', errors);
            return createTwitterErrorResponseJSON(errors);
        }

        return createSuccessResponseJson(data);
    },
);
