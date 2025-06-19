import { type ExploreSource, ExploreType, Source, TrendingType } from '@/constants/enum.js';

export function parseOldExploreUrl(url: URL): { source: ExploreSource; type: ExploreType } | null {
    if (!url.pathname.startsWith('/explore')) return null;
    const [, exploreTypeInUrl] = url.pathname.split('/');
    if (exploreTypeInUrl === 'top-profiles') return { source: Source.Twitter, type: ExploreType.TopProfiles };
    if (exploreTypeInUrl === 'crypto-trends') {
        return { source: TrendingType.Trending, type: ExploreType.CryptoTrends };
    }
    return null;
}
