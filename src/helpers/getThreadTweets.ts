import { type TwitterApi } from 'twitter-api-v2';

import { TWITTER_TIMELINE_OPTIONS } from '@/constants/twitter.js';
import { patchTweetsClientToFirefly } from '@/helpers/patchPostClientToFirefly.js';

function buildChainAlongPath(
    currentId: string,
    childrenMap: Map<string, Set<string>>,
    pathToRoot: Set<string>,
): string[] {
    const children = childrenMap.get(currentId);
    if (!children || children.size === 0) {
        return [currentId];
    }

    const nextInPath = Array.from(children).find((childId) => pathToRoot.has(childId));

    if (nextInPath) {
        return [currentId, ...buildChainAlongPath(nextInPath, childrenMap, pathToRoot)];
    }

    return [currentId];
}

async function findRootTweet(client: TwitterApi, tweetId: string, authorId: string): Promise<string> {
    const tweet = await client.v2.singleTweet(tweetId, {
        expansions: ['referenced_tweets.id', 'author_id'],
        'tweet.fields': ['referenced_tweets', 'author_id'],
    });

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

    const tweetIds = buildChainAlongPath(rootId, childrenMap, pathToRoot);

    const result = await client.v2.tweets(tweetIds, {
        ...TWITTER_TIMELINE_OPTIONS,
    });

    result.data = await patchTweetsClientToFirefly(result.data);
    return result;
}
