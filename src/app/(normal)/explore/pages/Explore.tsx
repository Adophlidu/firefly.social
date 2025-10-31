'use client';

import { safeUnreachable } from '@firefly/utils';

import { ChannelList } from '@/components/Channel/ChannelList.js';
import { TrendingNFTs } from '@/components/explore/TrendingNFTs.js';
import { SuggestedFollowUsersList } from '@/components/SuggestedFollows/SuggestedFollowUsersList.js';
import { TokenTrendingList } from '@/components/TokenTrendingList.js';
import { type ExploreSource, ExploreType, type SocialSource, TrendingType } from '@/constants/enum.js';

interface Props {
    source: ExploreSource;
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
                case TrendingType.TopGainers:
                case TrendingType.TopLosers:
                case TrendingType.Trending:
                case TrendingType.Meme:
                    return <TokenTrendingList type={sourceAsTrendingType} />;
                default:
                    safeUnreachable(sourceAsTrendingType);
                    return null;
            }
        }
        case ExploreType.NFTs:
            return <TrendingNFTs />;
        case ExploreType.Projects:
        case ExploreType.TruthSocial:
            return null;
        default:
            safeUnreachable(type);
            return null;
    }
}
