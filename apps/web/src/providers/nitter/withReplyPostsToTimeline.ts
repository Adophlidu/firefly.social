import { EMPTY_LIST } from '@dimensiondev/constants';
import { uniq } from 'lodash-es';
import type { TweetV2LookupResult } from 'twitter-api-v2';
import urlcat from 'urlcat';

import { patchTweetsClientToFirefly } from '@/helpers/patchPostClientToFirefly.js';
import { formatTwitterPostFromNitter } from '@/providers/nitter/formatTwitterPostFromNitter.js';
import { tweetV2ToPost } from '@/providers/twitter/formatTwitterPost.js';
import { resolveTwitterResponseData } from '@/providers/twitter/resolveTwitterResponseData.js';
import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';
import type { Tweet } from '@/providers/types/Nitter.js';
import type { ResponseJson } from '@/types/utility.js';

export async function withReplyPostsToTimeline(timeline: Tweet[]) {
    timeline = timeline.flat();
    const tweetIds = uniq(
        [...timeline.map((x) => x.replyId), ...timeline.map((x) => x.id)].filter((x) => x && x !== '0'),
    ).join(',');
    const response = await twitterSessionHolder.fetchWithSession<ResponseJson<TweetV2LookupResult>>(
        urlcat(`/api/twitter/tweets/:tweetIds`, {
            tweetIds,
        }),
    );
    const result = resolveTwitterResponseData(response);
    result.data = result.data ? await patchTweetsClientToFirefly(result.data) : EMPTY_LIST;
    return timeline.map((tweet) => {
        const tweetV2 = result.data?.find((x) => x.id === tweet.id);
        const commentTweetV2 = result.data?.find((x) => x.id === tweet.replyId);
        const commentOn = commentTweetV2 ? tweetV2ToPost(commentTweetV2) : undefined;
        return formatTwitterPostFromNitter(tweet, {
            base: { commentOn, commentLoadable: !commentOn },
            tweet: tweetV2,
            includes: result.includes,
        });
    });
}
