import { type ApiV2Includes, type TweetV2 } from 'twitter-api-v2';

import { logger } from '@/libs/Logger.js';

const RETWEET_STATUS_PAGE_SIZE = 100;
const RETWEET_STATUS_MAX_PAGES = 5;

export interface TweetLookupClient {
    viewerId?: string;
    v1: {
        tweets: (
            ids: string | string[],
            options: {
                include_entities: boolean;
                map: true;
                trim_user: true;
            },
        ) => Promise<{
            id: Record<
                string,
                {
                    retweeted: boolean;
                    current_user_retweet?: {
                        id: number;
                        id_str: string;
                    };
                } | null
            >;
        }>;
    };
    v2: {
        userTimeline: (
            userId: string,
            options: {
                exclude: ['replies'];
                max_results: number;
                pagination_token?: string;
                'tweet.fields': ['author_id', 'referenced_tweets'];
            },
        ) => Promise<{
            data: {
                data: TweetV2[];
                meta: {
                    next_token?: string;
                };
            };
        }>;
    };
}

function applyRetweetedStatus(retweetedStatus: Map<string, boolean>, data?: TweetV2[], includes?: ApiV2Includes) {
    for (const tweet of data ?? []) {
        tweet.retweeted = retweetedStatus.get(tweet.id) ?? false;
    }

    for (const tweet of includes?.tweets ?? []) {
        tweet.retweeted = retweetedStatus.get(tweet.id) ?? false;
    }
}

async function lookupRetweetedStatusViaV1(client: TweetLookupClient, tweetIds: string[]) {
    const retweetedStatus = new Map<string, boolean>();
    for (let i = 0; i < tweetIds.length; i += 100) {
        const lookup = await client.v1.tweets(tweetIds.slice(i, i + 100), {
            include_entities: false,
            map: true,
            trim_user: true,
        });

        for (const [tweetId, tweet] of Object.entries(lookup.id)) {
            retweetedStatus.set(tweetId, !!tweet?.retweeted || !!tweet?.current_user_retweet);
        }
    }

    return retweetedStatus;
}

async function lookupRetweetedStatusViaViewerTimeline(client: TweetLookupClient, tweetIds: string[]) {
    const viewerId = client.viewerId;
    if (!viewerId) return new Map<string, boolean>();

    const retweetedStatus = new Map<string, boolean>();
    const targetTweetIds = new Set(tweetIds);
    let pagination_token: string | undefined;

    for (let page = 0; page < RETWEET_STATUS_MAX_PAGES; page += 1) {
        const { data } = await client.v2.userTimeline(viewerId, {
            exclude: ['replies'],
            max_results: RETWEET_STATUS_PAGE_SIZE,
            pagination_token,
            'tweet.fields': ['author_id', 'referenced_tweets'],
        });

        for (const tweet of data.data ?? []) {
            const retweetedTweetId = tweet.referenced_tweets?.find((item) => item.type === 'retweeted')?.id;
            if (!retweetedTweetId || tweet.author_id !== viewerId || !targetTweetIds.has(retweetedTweetId)) continue;

            retweetedStatus.set(retweetedTweetId, true);
            if (retweetedStatus.size === targetTweetIds.size) return retweetedStatus;
        }

        pagination_token = data.meta.next_token;
        if (!pagination_token) break;
    }

    return retweetedStatus;
}

function isRetweetLookupAccessError(error: unknown) {
    if (!(error instanceof Error)) return false;

    const data = (error as { data?: unknown }).data;
    if (!data || typeof data !== 'object') return false;

    const v1Errors = (data as { errors?: Array<{ code?: number; message?: string }> }).errors;
    if (Array.isArray(v1Errors)) {
        return v1Errors.some((item) => item.code === 453 || item.message?.includes('subset of X API V2 endpoints'));
    }

    const detail = (data as { detail?: string }).detail;
    return typeof detail === 'string' && detail.includes('subset of X API V2 endpoints');
}

export async function attachRetweetedStatusToTweets(
    client: TweetLookupClient | null,
    data?: TweetV2[],
    includes?: ApiV2Includes,
) {
    if (!client) return;

    const tweetIds = Array.from(
        new Set([...(data?.map((tweet) => tweet.id) ?? []), ...(includes?.tweets?.map((tweet) => tweet.id) ?? [])]),
    );
    if (!tweetIds.length) return;

    try {
        const retweetedStatus = await lookupRetweetedStatusViaViewerTimeline(client, tweetIds);
        applyRetweetedStatus(retweetedStatus, data, includes);
    } catch (error) {
        logger.error('[twitter] failed to hydrate retweet status from viewer timeline', error);
    }

    try {
        const retweetedStatus = await lookupRetweetedStatusViaV1(client, tweetIds);
        applyRetweetedStatus(retweetedStatus, data, includes);
        return;
    } catch (error) {
        if (isRetweetLookupAccessError(error)) {
            logger.error('[twitter] v1 retweet status lookup unavailable', error);
        } else {
            logger.error('[twitter] failed to hydrate retweet status via v1 lookup', error);
        }
    }
}
