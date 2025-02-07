import { type ExploreSource, Source, TrendingType } from '@/constants/enum.js';
import { UnreachableError } from '@/constants/error.js';
import { createLookupTableResolver } from '@/helpers/createLookupTableResolver.js';

export const resolveSourceName = createLookupTableResolver<Source, string>(
    {
        [Source.Lens]: 'Lens',
        [Source.Farcaster]: 'Farcaster',
        [Source.Twitter]: 'X',
        [Source.Bsky]: 'Bluesky',
        [Source.Firefly]: 'Firefly',
        [Source.Article]: 'Articles',
        [Source.Wallet]: 'Wallets',
        [Source.NFTs]: 'NFTs',
        [Source.DAOs]: 'DAOs',
        [Source.Polymarket]: 'Bets',
        [Source.Telegram]: 'Telegram',
        [Source.Google]: 'Google',
        [Source.Apple]: 'Apple',
        [Source.Posts]: 'Posts',
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

export const resolveExploreSourceName = createLookupTableResolver<ExploreSource, string>(
    {
        [Source.Lens]: 'Lens',
        [Source.Farcaster]: 'Farcaster',
        [Source.Bsky]: 'Bluesky',
        [TrendingType.TopGainers]: 'Top Gainers',
        [TrendingType.TopLosers]: 'Top Losers',
        [TrendingType.Trending]: 'Trending',
        [TrendingType.Meme]: 'Meme',
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

export function resolveSourcesName(sources: Source[], separator = ', '): string {
    return sources.map(resolveSourceName).join(separator);
}
