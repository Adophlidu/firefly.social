import { type InlineErrorV2 } from 'twitter-api-v2';

const TWITTER_V2_RESOURCE_NOT_FOUND_TYPE = 'https://api.twitter.com/2/problems/resource-not-found';

export function isReferencedTweetNotFoundError(error: InlineErrorV2 | unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const e = error as InlineErrorV2;
    const parameter = (e as unknown as { parameter?: string }).parameter;
    const resourceType = (e as unknown as { resource_type?: string }).resource_type;
    const type = (e as unknown as { type?: string }).type;

    return (
        type === TWITTER_V2_RESOURCE_NOT_FOUND_TYPE &&
        resourceType === 'tweet' &&
        (parameter === 'referenced_tweets.id' || parameter === 'referenced_tweets.id.author_id')
    );
}

export function withoutReferencedTweetExpansions<T extends { expansions?: unknown }>(params: T): T {
    const expansions = (params as unknown as { expansions?: unknown }).expansions;
    if (!Array.isArray(expansions) || expansions.length === 0) return params;

    const filtered = expansions.filter((x) => x !== 'referenced_tweets.id' && x !== 'referenced_tweets.id.author_id');
    if (filtered.length === expansions.length) return params;

    return {
        ...(params as object),
        expansions: filtered,
    } as T;
}
