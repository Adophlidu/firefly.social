import { type TweetV2 } from 'twitter-api-v2';

export function resolveTwitterRetweetStatus(
    tweet: Pick<TweetV2, 'author_id' | 'retweeted'>,
    currentProfileId?: string,
    retweetedTweet?: Pick<TweetV2, 'retweeted'>,
) {
    return (
        !!tweet.retweeted || !!retweetedTweet?.retweeted || (tweet.author_id && tweet.author_id === currentProfileId)
    );
}
