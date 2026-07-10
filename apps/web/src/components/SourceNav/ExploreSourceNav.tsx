'use client';

import { EXPLORE_SOURCES } from '@dimensiondev/constants/computed';
import { type ExploreSource, type ExploreSourceInURL, ExploreType, Source, TrendingType } from '@dimensiondev/enums';
import { NetworkType } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { robinhood, solana } from '@dimensiondev/web3/chains';
import { omit } from 'lodash-es';
import { type HTMLProps, memo, useMemo } from 'react';
import { base, bsc, mainnet } from 'viem/chains';

import { FilterPanel } from '@/components/FilterPanel.js';
import { SourceNav } from '@/components/SourceNav/SourceNav.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import { resolveExploreSource } from '@/helpers/resolveSourceInUrl.js';
import { resolveExploreSourceName } from '@/helpers/resolveSourceName.js';
import { useExploreTrendingFilterStore } from '@/store/useExploreTrendingFilterStore.js';
import { useBskyProfileStore } from '@/store/useProfileStore/useBskyProfileStore.js';

const exploreTokenChainList = [
    {
        id: mainnet.id,
        networkType: NetworkType.Ethereum,
        name: mainnet.name,
    },
    {
        id: solana.id,
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
    {
        id: robinhood.id,
        networkType: NetworkType.Ethereum,
        name: 'Robinhood',
    },
];

interface Props extends HTMLProps<HTMLDivElement> {
    source: ExploreSourceInURL;
    explore: ExploreType;
}

export const ExploreSourceNav = memo<Props>(function ExploreSourceNav({ explore, source, ...rest }) {
    const currentProfile = useBskyProfileStore.use.currentProfile();
    const sources = useMemo(() => {
        const allSources = EXPLORE_SOURCES[explore];
        return explore === ExploreType.TopProfiles && !currentProfile
            ? allSources?.filter((x) => x !== Source.Bsky)
            : allSources;
    }, [currentProfile, explore]);
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
