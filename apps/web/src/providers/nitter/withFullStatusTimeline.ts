import { uniq } from 'lodash-es';
import { type TweetV2LookupResult } from 'twitter-api-v2';
import urlcat from 'urlcat';

import { formatTwitterPostFromNitter } from '@/providers/nitter/formatTwitterPostFromNitter.js';
import { resolveTwitterResponseData } from '@/providers/twitter/resolveTwitterResponseData.js';
import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';
import { type Tweet } from '@/providers/types/Nitter.js';
import { type ResponseJson } from '@/types/utility.js';

export async function withFullStatusTimeline(timeline: Tweet[]) {
    timeline = timeline.flat();
    const tweetIds = uniq(timeline.map((x) => x.id).filter((x) => x && x !== '0')).join(',');
    const response = await twitterSessionHolder.fetchWithSession<ResponseJson<TweetV2LookupResult>>(
        urlcat(`/api/twitter/tweets/:tweetIds`, {
            tweetIds,
        }),
    );
    const data = resolveTwitterResponseData(response);
    return timeline.map((tweet) => {
        const tweetV2 = data.data?.find((x) => x.id === tweet.id);
        return formatTwitterPostFromNitter(tweet, {
            tweet: tweetV2,
            includes: data.includes,
        });
    });
}
