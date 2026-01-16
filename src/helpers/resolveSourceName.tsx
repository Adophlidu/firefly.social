import { createLookupTableResolver, UnreachableError } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { type JSX } from 'react';

import { type ExploreSource, type NotificationSource, Source, TrendingType } from '@/constants/enum.js';

export const resolveSourceName = createLookupTableResolver<Source, string>(
    {
        [Source.Lens]: 'Lens',
        [Source.Farcaster]: 'Farcaster',
        [Source.Twitter]: 'X',
        [Source.Bsky]: 'Bluesky',
        [Source.Firefly]: 'Firefly',
        [Source.Article]: 'Articles',
        [Source.Wallet]: 'Wallets',
        [Source.WalletMix]: 'Wallets',
        [Source.NFTs]: 'NFTs',
        [Source.Tokens]: 'Tokens',
        [Source.DAOs]: 'DAOs',
        [Source.Prediction]: 'Predictions',
        [Source.Telegram]: 'Telegram',
        [Source.Google]: 'Google',
        [Source.Apple]: 'Apple',
        [Source.Posts]: 'Posts',
        [Source.Notifications]: 'Notifications',
        [Source.Email]: 'Email',
        [Source.Swap]: 'Swaps',
        [Source.Transactions]: 'Transactions',
        [Source.Activities]: 'Activities',
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);
export const resolveSourceUIName = createLookupTableResolver<Source, string | JSX.Element>(
    {
        [Source.Lens]: 'Lens',
        [Source.Farcaster]: 'Farcaster',
        [Source.Twitter]: 'X',
        [Source.Bsky]: 'Bluesky',
        [Source.Firefly]: 'Firefly',
        [Source.Article]: <Trans>Articles</Trans>,
        [Source.Wallet]: <Trans>Wallets</Trans>,
        [Source.WalletMix]: <Trans>Wallets</Trans>,
        [Source.NFTs]: <Trans>NFTs</Trans>,
        [Source.Tokens]: <Trans>Tokens</Trans>,
        [Source.DAOs]: <Trans>DAOs</Trans>,
        [Source.Prediction]: <Trans>Predictions</Trans>,
        [Source.Telegram]: 'Telegram',
        [Source.Google]: 'Google',
        [Source.Apple]: 'Apple',
        [Source.Posts]: <Trans>Posts</Trans>,
        [Source.Notifications]: <Trans>Notifications</Trans>,
        [Source.Email]: <Trans>Email</Trans>,
        [Source.Swap]: <Trans>Swaps</Trans>,
        [Source.Transactions]: <Trans>Trades</Trans>,
        [Source.Activities]: <Trans>Activities</Trans>,
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

export const resolveExploreSourceName = createLookupTableResolver<ExploreSource, string | JSX.Element>(
    {
        [Source.Lens]: 'Lens',
        [Source.Farcaster]: 'Farcaster',
        [Source.Bsky]: 'Bluesky',
        [Source.Twitter]: 'X',
        [TrendingType.Newest]: <Trans>Newest</Trans>,
        [TrendingType.Stocks]: <Trans>Stocks</Trans>,
        [TrendingType.Trending]: <Trans>Trending</Trans>,
        [TrendingType.TopSearches]: <Trans>Top Searches</Trans>,
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

export const resolveNotificationSourceName = createLookupTableResolver<NotificationSource, string | JSX.Element>(
    {
        [Source.Notifications]: <Trans>All</Trans>,
        [Source.Lens]: 'Lens',
        [Source.Farcaster]: 'Farcaster',
        [Source.Bsky]: 'Bluesky',
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

export function resolveSourcesName(sources: Source[], separator = ', ', useOr = false): string {
    if (!useOr || sources.length <= 1) {
        return sources.map(resolveSourceName).join(separator);
    }

    const sourceNames = sources.map(resolveSourceName);
    const lastName = sourceNames.pop();

    return `${sourceNames.join(separator)}${sourceNames.length > 0 ? ' or ' : ''}${lastName}`;
}
