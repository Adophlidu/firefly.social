import { type TweetV2 } from 'twitter-api-v2';
import { describe, expect, it, vi } from 'vitest';

import {
    attachRetweetedStatusToTweets,
    type TweetLookupClient,
} from '@/providers/twitter/attachRetweetedStatusToTweets.js';

function createTweet(id: string): TweetV2 {
    return {
        id,
        text: id,
        edit_history_tweet_ids: [id],
    };
}

describe('attachRetweetedStatusToTweets', () => {
    it('hydrates retweeted status for both main data and includes tweets', async () => {
        const data = [createTweet('1')];
        const includes = {
            tweets: [createTweet('2')],
        };

        const client = {
            v1: {
                tweets: vi.fn(async () => ({
                    id: {
                        '1': { retweeted: true },
                        '2': { retweeted: false, current_user_retweet: { id: 1, id_str: '1' } },
                    },
                })),
            },
            v2: {
                userTimeline: vi.fn(),
            },
        };

        await attachRetweetedStatusToTweets(client, data, includes);

        expect(data[0].retweeted).toBe(true);
        expect(includes.tweets[0].retweeted).toBe(true);
        expect(client.v1.tweets).toHaveBeenCalledTimes(1);
        expect(client.v2.userTimeline).not.toHaveBeenCalled();
    });

    it('falls back to viewer timeline when v1 lookup is unavailable', async () => {
        const data = [createTweet('1')];
        const includes = {
            tweets: [createTweet('2')],
        };

        const client = {
            viewerId: 'viewer',
            v1: {
                tweets: vi.fn(async () => {
                    const error = new Error('forbidden') as Error & {
                        data: { errors: Array<{ code: number; message: string }> };
                    };
                    error.data = {
                        errors: [
                            {
                                code: 453,
                                message: 'You currently have access to a subset of X API V2 endpoints',
                            },
                        ],
                    };
                    throw error;
                }),
            },
            v2: {
                userTimeline: vi
                    .fn()
                    .mockResolvedValueOnce({
                        data: {
                            data: [
                                {
                                    ...createTweet('retweet-1'),
                                    author_id: 'viewer',
                                    referenced_tweets: [{ id: '2', type: 'retweeted' }],
                                },
                            ],
                            meta: {
                                next_token: 'next-page',
                            },
                        },
                    })
                    .mockResolvedValueOnce({
                        data: {
                            data: [
                                {
                                    ...createTweet('retweet-2'),
                                    author_id: 'viewer',
                                    referenced_tweets: [{ id: '1', type: 'retweeted' }],
                                },
                            ],
                            meta: {},
                        },
                    }),
            },
        };

        await attachRetweetedStatusToTweets(client, data, includes);

        expect(data[0].retweeted).toBe(true);
        expect(includes.tweets[0].retweeted).toBe(true);
        expect(client.v1.tweets).toHaveBeenCalledTimes(1);
        expect(client.v2.userTimeline).toHaveBeenCalledTimes(2);
    });

    it('still falls back when v1 lookup fails for a non-access reason', async () => {
        const data = [createTweet('1')];

        const client = {
            viewerId: 'viewer',
            v1: {
                tweets: vi.fn(async () => {
                    throw new Error('unexpected lookup failure');
                }),
            },
            v2: {
                userTimeline: vi.fn(async () => ({
                    data: {
                        data: [
                            {
                                ...createTweet('retweet-1'),
                                author_id: 'viewer',
                                referenced_tweets: [{ id: '1', type: 'retweeted' }],
                            },
                        ],
                        meta: {},
                    },
                })),
            },
        };

        await attachRetweetedStatusToTweets(client as TweetLookupClient, data, undefined);

        expect(data[0].retweeted).toBe(true);
        expect(client.v1.tweets).toHaveBeenCalledTimes(1);
        expect(client.v2.userTimeline).toHaveBeenCalledTimes(1);
    });

    it('degrades gracefully when fallback hydration fails', async () => {
        const data = [createTweet('1')];

        const client = {
            viewerId: 'viewer',
            v1: {
                tweets: vi.fn(async () => {
                    const error = new Error('forbidden') as Error & {
                        data: { errors: Array<{ code: number; message: string }> };
                    };
                    error.data = {
                        errors: [
                            {
                                code: 453,
                                message: 'You currently have access to a subset of X API V2 endpoints',
                            },
                        ],
                    };
                    throw error;
                }),
            },
            v2: {
                userTimeline: vi.fn(async () => {
                    throw new Error('timeline unavailable');
                }),
            },
        };

        await expect(attachRetweetedStatusToTweets(client, data, undefined)).resolves.toBeUndefined();
        expect(data[0].retweeted).toBeUndefined();
    });

    it('does nothing when no user client is available', async () => {
        const data = [createTweet('1')];

        await attachRetweetedStatusToTweets(null, data, undefined);

        expect(data[0].retweeted).toBeUndefined();
    });
});
