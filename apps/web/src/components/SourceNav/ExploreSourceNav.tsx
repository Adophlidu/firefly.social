'use client';

import { classNames } from '@dimensiondev/utils';
import { omit } from 'lodash-es';
import { type HTMLProps, memo, useMemo } from 'react';
import { base, bsc, mainnet } from 'viem/chains';

import { FilterPanel } from '@/components/FilterPanel.js';
import { SourceNav } from '@/components/SourceNav/SourceNav.js';
import { EXPLORE_SOURCES } from '@/constants/computed.js';
import {
    type ExploreSource,
    type ExploreSourceInURL,
    ExploreType,
    NetworkType,
    Source,
    TrendingType,
} from '@/constants/enum.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import { resolveExploreSource } from '@/helpers/resolveSourceInUrl.js';
import { resolveExploreSourceName } from '@/helpers/resolveSourceName.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { useExploreTrendingFilterStore } from '@/store/useExploreTrendingFilterStore.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

const exploreTokenChainList = [
    {
        id: mainnet.id,
        networkType: NetworkType.Ethereum,
        name: mainnet.name,
    },
    {
        id: SolanaChainId.Mainnet,
        networkType: NetworkType.Solana,
        name: 'Solana',
    },
    {
        id: bsc.id,
        networkType: NetworkType.Ethereum,
        name: 'BSC',
    },
    {
        id: base.id,
        networkType: NetworkType.Ethereum,
        name: base.name,
    },
];

interface Props extends HTMLProps<HTMLDivElement> {
    source: ExploreSourceInURL;
    explore: ExploreType;
}

export const ExploreSourceNav = memo<Props>(function ExploreSourceNav({ explore, source, ...rest }) {
    const currentBskyProfile = useCurrentProfile(Source.Bsky);
    const sources = useMemo(() => {
        const allSources = EXPLORE_SOURCES[explore];
        return explore === ExploreType.TopProfiles && !currentBskyProfile
            ? allSources?.filter((x) => x !== Source.Bsky)
            : allSources;
    }, [currentBskyProfile, explore]);
    const { selectedChainId, selectedTimeRange, setSelectedChainId, setSelectedTimeRange } =
        useExploreTrendingFilterStore();

    const customNameResolver = useMemo(
        () => (src: ExploreSource) => {
            if (explore === ExploreType.TopChannels && src === Source.Lens) {
                return 'Lens';
            }
            return resolveExploreSourceName(src);
        },
        [explore],
    );

    if (!sources?.length) return null;

    return (
        <div className={classNames('flex items-center justify-between', rest.className)}>
            <SourceNav
                source={resolveExploreSource(source)}
                sources={sources}
                urlResolver={(source) => resolveExploreUrl(explore, source)}
                nameResolver={customNameResolver}
                {...omit(rest, 'className')}
            />
            {explore === ExploreType.CryptoTrends && source !== TrendingType.TopSearches ? (
                <FilterPanel
                    validChains={exploreTokenChainList}
                    disableChainChange={source === TrendingType.Stocks}
                    enableTimeRange={source === TrendingType.Trending || source === TrendingType.Stocks}
                    selectedChainId={source === TrendingType.Stocks ? 101 : selectedChainId}
                    onChainChange={setSelectedChainId}
                    selectedTimeRange={selectedTimeRange}
                    onTimeRangeChange={setSelectedTimeRange}
                    iconSize={14}
                    chainIconSize={14}
                />
            ) : null}
        </div>
    );
});
