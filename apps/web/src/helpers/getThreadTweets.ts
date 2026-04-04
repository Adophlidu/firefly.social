import { NotFoundError } from '@dimensiondev/utils';
import { type TwitterApi } from 'twitter-api-v2';

import { TWITTER_TIMELINE_OPTIONS } from '@/constants/twitter.js';
import { patchTweetsClientToFirefly } from '@/helpers/patchPostClientToFirefly.js';

function buildCompleteChain(
    currentId: string,
    targetId: string,
    childrenMap: Map<string, Set<string>>,
    pathToRoot: Set<string>,
    tweetTimeMap: Map<string, Date>,
    reachedTarget = false,
): string[] {
    const children = childrenMap.get(currentId);
    if (!children || children.size === 0) {
        return [currentId];
    }

    let nextId: string | undefined;

    if (!reachedTarget) {
        nextId = Array.from(children).find((childId) => pathToRoot.has(childId));
        const hasReachedTarget = currentId === targetId || nextId === targetId;

        if (nextId) {
            return [
                currentId,
                ...buildCompleteChain(nextId, targetId, childrenMap, pathToRoot, tweetTimeMap, hasReachedTarget),
            ];
        }
    } else {
        let earliestTime: Date | undefined;

        children.forEach((childId) => {
            const childTime = tweetTimeMap.get(childId);
            if (childTime && (!earliestTime || childTime < earliestTime)) {
                earliestTime = childTime;
                nextId = childId;
            }
        });

        if (nextId) {
            return [currentId, ...buildCompleteChain(nextId, targetId, childrenMap, pathToRoot, tweetTimeMap, true)];
        }
    }

    return [currentId];
}

async function findRootTweet(client: TwitterApi, tweetId: string, authorId: string): Promise<string> {
    const tweet = await client.v2.singleTweet(tweetId, {
        expansions: ['referenced_tweets.id', 'author_id'],
        'tweet.fields': ['referenced_tweets', 'author_id'],
    });

    if (!tweet.data) {
        return tweetId;
    }

    const repliedToTweet = tweet.data.referenced_tweets?.find((ref) => ref.type === 'replied_to');
    if (!repliedToTweet) {
        return tweetId;
    }

    const repliedTweetData = tweet.includes?.tweets?.find((t) => t.id === repliedToTweet.id);
    if (repliedTweetData?.author_id === authorId) {
        return findRootTweet(client, repliedToTweet.id, authorId);
    }

    return tweetId;
}

export async function getThreadTweets(client: TwitterApi, id: string) {
    const originalTweet = await client.v2.singleTweet(id, {
        'tweet.fields': ['conversation_id', 'author_id'],
    });

    if (!originalTweet.data) {
        throw new NotFoundError('Post not found');
    }

    const conversationId = originalTweet.data.conversation_id || id;
    const authorId = originalTweet.data.author_id;

    if (!authorId) {
        throw new Error('Author ID not found');
    }

    const rootId = await findRootTweet(client, id, authorId);

    const searchResult = await client.v2.search(`conversation_id:${conversationId} from:${authorId}`, {
        'tweet.fields': ['referenced_tweets', 'author_id', 'created_at'],
        expansions: ['referenced_tweets.id'],
        max_results: 100,
    });

    if (!searchResult.data.data || searchResult.data.data.length === 0) {
        const result = await client.v2.tweets([id], {
            ...TWITTER_TIMELINE_OPTIONS,
        });
        result.data = await patchTweetsClientToFirefly(result.data);
        return result;
    }

    const tweets = searchResult.data.data;

    const tweetTimeMap = new Map<string, Date>();
    tweets.forEach((tweet) => {
        if (tweet.author_id !== authorId) return;
        if (tweet.created_at) {
            tweetTimeMap.set(tweet.id, new Date(tweet.created_at));
        }
    });

    const childrenMap = new Map<string, Set<string>>();
    tweets.forEach((tweet) => {
        if (tweet.author_id !== authorId) return;

        const repliedTo = tweet.referenced_tweets?.find((ref) => ref.type === 'replied_to');
        if (repliedTo?.id) {
            if (!childrenMap.has(repliedTo.id)) {
                childrenMap.set(repliedTo.id, new Set());
            }
            childrenMap.get(repliedTo.id)!.add(tweet.id);
        }
    });

    const pathToRoot = new Set<string>();
    let currentId: string | undefined = id;

    const tweetMap = new Map(tweets.map((t) => [t.id, t]));

    while (currentId) {
        pathToRoot.add(currentId);
        if (currentId === rootId) break;

        const tweet = tweetMap.get(currentId);
        const repliedTo = tweet?.referenced_tweets?.find((ref) => ref.type === 'replied_to');
        currentId = repliedTo?.id;
    }

    const tweetIds = buildCompleteChain(rootId, id, childrenMap, pathToRoot, tweetTimeMap);

    const result = await client.v2.tweets(tweetIds, {
        ...TWITTER_TIMELINE_OPTIONS,
    });

    result.data = await patchTweetsClientToFirefly(result.data);
    return result;
}
