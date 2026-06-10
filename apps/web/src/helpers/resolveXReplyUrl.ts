import urlcat from 'urlcat';

/**
 * Resolve the X (Twitter) web intent URL that opens the official compose box
 * as a reply to the given tweet.
 */
export function resolveXReplyUrl(tweetId: string) {
    if (!tweetId) return '';
    return urlcat('https://x.com/intent/tweet', { in_reply_to: tweetId });
}
