'use client';

import type { SocialSource } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';

import { ChannelList } from '@/components/Channel/ChannelList.js';
import { PredictionList } from '@/components/PredictionList.js';
import { SuggestedFollowUsersList } from '@/components/SuggestedFollows/SuggestedFollowUsersList.js';
import { TokenTrendingList } from '@/components/TokenTrendingList.js';
import { ExploreType, TrendingType } from '@/constants/enum.js';

interface Props {
    source: string;
    type: ExploreType;
}

export function ExplorePage({ source, type }: Props) {
    switch (type) {
        case ExploreType.TopProfiles:
            return <SuggestedFollowUsersList source={source as SocialSource} />;
        case ExploreType.TopChannels:
            return <ChannelList source={source as SocialSource} />;
        case ExploreType.CryptoTrends: {
            const sourceAsTrendingType = source as TrendingType;

            switch (sourceAsTrendingType) {
                case TrendingType.Trending:
                    return <TokenTrendingList type={sourceAsTrendingType} />;
                case TrendingType.Stocks:
                case TrendingType.Newest:
                case TrendingType.TopSearches:
                    return <TokenTrendingList type={sourceAsTrendingType} />;
                default:
                    safeUnreachable(sourceAsTrendingType);
                    return null;
            }
        }
        case ExploreType.Projects:
        case ExploreType.TruthSocial:
            return null;
        case ExploreType.Prediction:
            return <PredictionList source={source} />;
        default:
            safeUnreachable(type);
            return null;
    }
}
