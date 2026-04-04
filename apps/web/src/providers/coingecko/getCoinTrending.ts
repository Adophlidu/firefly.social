import { uniq, uniqBy } from 'lodash-es';

import { getClubLink } from '@/helpers/getCommunityLink.js';
import { resolveCoinGeckoChainId } from '@/helpers/resolveCoinGeckoChainId.js';
import { getCoinInfo } from '@/providers/coingecko/getCoinInfo.js';
import { getSupportedPlatforms } from '@/providers/coingecko/getSupportedPlatforms.js';
import { trendingModifiers } from '@/providers/coingecko/trendingModifiers.js';
import { type Contract, type Trending, TrendingProvider } from '@/providers/types/Trending.js';

export async function getCoinTrending(coinId: string): Promise<Trending> {
    const info = await getCoinInfo(coinId);
    if ('error' in info) throw new Error(info.error);

    const platform_url = `https://www.coingecko.com/en/coins/${info.id}`;
    const twitter_url = info.links.twitter_screen_name ? `https://twitter.com/${info.links.twitter_screen_name}` : '';
    const facebook_url = info.links.facebook_username ? `https://facebook.com/${info.links.facebook_username}` : '';
    const telegram_url = info.links.telegram_channel_identifier
        ? `https://t.me/${info.links.telegram_channel_identifier}`
        : '';
    const platforms = await getSupportedPlatforms();
    const contracts: Contract[] = Object.entries(info.platforms)
        .map(([runtime, address]) => ({
            chainId: platforms.find((x) => x.id === runtime)?.chain_identifier ?? resolveCoinGeckoChainId(runtime),
            address,
            runtime,
        }))
        .filter((x) => x.address) as Contract[];

    const trending: Trending = {
        lastUpdated: info.last_updated,
        provider: TrendingProvider.CoinGecko,
        contracts,
        coin: {
            id: coinId,
            name: info.name,
            symbol: info.symbol.toUpperCase(),
            type: 'Fungible',
            description: info.description.en,
            // Use market_cap_rank_with_rehypothecated as fallback for rehypothecated tokens
            market_cap_rank: info.market_cap_rank ?? info.market_cap_rank_with_rehypothecated ?? undefined,
            image_url: info.image.small,
            tags: info.categories.filter(Boolean),
            announcement_urls: info.links.announcement_url.filter(Boolean),
            community_urls: getClubLink(
                uniqBy(
                    [
                        twitter_url,
                        facebook_url,
                        telegram_url,
                        info.links.subreddit_url,
                        ...info.links.chat_url,
                        ...info.links.official_forum_url,
                    ].filter(Boolean),
                    (x) => x.toLowerCase(),
                ),
            ),
            source_code_urls: Object.values(info.links.repos_url).flatMap((x) => x),
            home_urls: info.links.homepage.filter(Boolean),
            blockchain_urls: uniq(
                [platform_url, ...info.links.blockchain_site].filter(Boolean).map((url) => url.toLowerCase()),
            ),
            platform_url,
            facebook_url,
            twitter_url,
            telegram_url,
            contract_address: info.contract_address,
        },
        market: (() => {
            const entries = Object.entries(info.market_data).map(([key, value]) => {
                if (value && typeof value === 'object') {
                    return [key, value.usd ?? 0];
                }
                return [key, value];
            });
            return Object.fromEntries(entries);
        })(),
    };
    return trendingModifiers(trending);
}
