'use client';

import { msg } from '@lingui/core/macro';
import { safeUnreachable } from '@masknet/kit';

import { ChannelList } from '@/components/Channel/ChannelList.js';
import { SuggestedFollowUsersList } from '@/components/SuggestedFollows/SuggestedFollowUsersList.js';
import { TokenTrendingList } from '@/components/TokenTrendingList.js';
import { type ExploreSource, ExploreType, type SocialSource, TrendingType } from '@/constants/enum.js';
import { useNavigatorTitle } from '@/hooks/useNavigatorTitle.js';

interface Props {
    source: ExploreSource;
    type: ExploreType;
}

export function ExplorePage({ source, type }: Props) {
    useNavigatorTitle(msg`Explore`);

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
        case ExploreType.Projects:
            return null;
        default:
            safeUnreachable(type);
            return null;
    }
}
