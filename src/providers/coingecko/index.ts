import { produce } from 'immer';
import { uniq, uniqBy } from 'lodash-es';
import urlcat from 'urlcat';

import { TrendingType } from '@/constants/enum.js';
import { COINGECKO_ROOT_URL, CORS_HOST, DSEARCH_BASE_URL } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getClubLink } from '@/helpers/getCommunityLink.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { isValidChainIdSolana } from '@/helpers/isValidChainId.js';
import { isZeroAddressEthereum, isZeroAddressSolana } from '@/helpers/isZeroAddress.js';
import { resolveCoinGeckoChainId } from '@/helpers/resolveCoinGeckoChainId.js';
import type {
    CoinGeckoAsset,
    CoinGeckoCoinInfo,
    CoinGeckoCoinTrending,
    CoinGeckoGainsLoserInfo,
    CoinGeckoMemeCoinTrending,
    CoinGeckoPlatform,
    CoinGeckoToken,
    Price,
} from '@/providers/types/CoinGecko.js';
import { type Contract, type Trending, TrendingProvider } from '@/providers/types/Trending.js';
import type { TokenWithMarket } from '@/services/searchTokens.js';
import { getCoinGeckoConstants } from '@/web3-shared/evm/constants.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';
import { getCoinGeckoConstants as getCoinGeckoConstantsSolana } from '@/web3-shared/solana/constants.js';

/**
 * @internal
 * some custom modifiers
 */
function trendingModifiers(trending: Trending) {
    if (trending.coin.id === 'avalanche-2') {
        return produce(trending, (draft) => {
            draft.contracts = [
                { address: '0x1ce0c2827e2ef14d5c4f29a091d735a204794041', chainId: 56, runtime: 'ethereum' },
                { address: '0x4792c1ecb969b036eb51330c63bd27899a13d84e', chainId: 1284, runtime: 'ethereum' },
            ];
        });
    } else if (trending.coin.id === 'mask-network') {
        return produce(trending, (draft) => {
            draft.contracts = draft.contracts?.filter((x) => x.runtime !== 'energi') ?? [];
        });
    }
    return trending;
}

function formatGainsOrLoser(info: CoinGeckoGainsLoserInfo): TokenWithMarket {
    return {
        api_symbol: info.symbol,
        id: info.id,
        name: info.name,
        largeLogo: info.image,
        market_cap_rank: info.market_cap_rank,
        symbol: info.symbol,
        thumbnail: info.image,
        market: {
            current_price: info.usd,
            price_change_percentage_24h: info.usd_24h_change,
        },
    };
}

export class CoinGecko {
    static getTokens() {
        const url = urlcat(DSEARCH_BASE_URL, '/fungible-tokens/coingecko.json');
        return fetchJson<CoinGeckoToken[]>(`${CORS_HOST}?${encodeURIComponent(url)}`, { mode: 'cors' });
    }

    static async getTokenPrice(coinId: string): Promise<number | undefined> {
        const url = urlcat(COINGECKO_ROOT_URL, '/simple/price', { ids: coinId, vs_currencies: 'usd' });
        const price = await fetchJson<Record<string, Record<string, number>>>(url);
        return price[coinId]?.usd;
    }

    static getFungibleTokenPrice(chainId: number, address: string) {
        const isSolana = isValidChainIdSolana(chainId);
        const { PLATFORM_ID = '', COIN_ID = '' } = isSolana
            ? getCoinGeckoConstantsSolana(chainId)
            : getCoinGeckoConstants(chainId);

        const isNative = isSolana
            ? isZeroAddressSolana(address)
            : isZeroAddressEthereum(address) || !isValidAddressEthereum(address);

        return isNative ? CoinGecko.getTokenPrice(COIN_ID) : CoinGecko.getTokenPriceByAddress(PLATFORM_ID, address);
    }

    static async getTokenPriceByAddress(platform_id: string, address: string) {
        const price = await CoinGecko.getTokenPrices(platform_id, [address]);
        const currencies = Object.entries(price).find(([key, value]) => {
            return isSameAddress(key, address) ? value : undefined;
        })?.[1];
        return currencies?.usd ? Number(currencies.usd) : undefined;
    }

    static async getTokenPrices(platform_id: string, contractAddresses: string[]) {
        const url = urlcat(COINGECKO_ROOT_URL, '/simple/token_price/:platform_id', {
            platform_id,
            contract_addresses: contractAddresses.join(','),
            vs_currencies: 'usd',
        });

        return fetchJson<Record<string, Price>>(url);
    }

    /** @deprecated use FireflyEndpoint.getTokenPriceStats */
    static async getPriceStats(coinId: string, days?: number) {
        type Stat = [number, number];
        const url = urlcat(COINGECKO_ROOT_URL, `/coins/${coinId}/market_chart`, {
            vs_currency: 'usd',
            days: days || 11430,
        });
        return fetchJson<{
            market_caps: Stat[];
            prices: Stat[];
            total_volumes: Stat[];
        }>(url);
    }

    static getCoinInfo(coinId: string) {
        if (coinId.trim().includes(' ')) {
            throw new Error('Invalid coinId');
        }
        return fetchJson<
            | CoinGeckoCoinInfo
            | {
                  error: string;
              }
        >(
            urlcat(COINGECKO_ROOT_URL, `/coins/${coinId}`, {
                developer_data: false,
                community_data: false,
                localization: false,
            }),
        );
    }
    private static async getSupportedPlatforms() {
        const response = await fetchJson<CoinGeckoPlatform[]>(`${COINGECKO_ROOT_URL}/asset_platforms`);
        return response.filter((x) => x.id && x.chain_identifier) ?? [];
    }

    static async getCoinTrending(coinId: string): Promise<Trending> {
        const info = await this.getCoinInfo(coinId);
        if ('error' in info) throw new Error(info.error);

        const platform_url = `https://www.coingecko.com/en/coins/${info.id}`;
        const twitter_url = info.links.twitter_screen_name
            ? `https://twitter.com/${info.links.twitter_screen_name}`
            : '';
        const facebook_url = info.links.facebook_username ? `https://facebook.com/${info.links.facebook_username}` : '';
        const telegram_url = info.links.telegram_channel_identifier
            ? `https://t.me/${info.links.telegram_channel_identifier}`
            : '';
        const platforms = await this.getSupportedPlatforms();
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
                market_cap_rank: info.market_cap_rank,
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

    static async getTopGainersOrLosers(
        type: TrendingType.TopGainers | TrendingType.TopLosers,
    ): Promise<TokenWithMarket[]> {
        const response = await fetchJson<{
            top_gainers: CoinGeckoGainsLoserInfo[];
            top_losers: CoinGeckoGainsLoserInfo[];
        }>(urlcat(COINGECKO_ROOT_URL, '/coins/top_gainers_losers', { vs_currency: 'usd' }));

        const data = type === TrendingType.TopGainers ? response.top_gainers : response.top_losers;
        return data.map(formatGainsOrLoser);
    }

    static async getTopTrendingCoins() {
        const response = await fetchJson<{ coins: Array<{ item: CoinGeckoCoinTrending }> }>(
            urlcat(COINGECKO_ROOT_URL, '/search/trending'),
        );

        return response.coins.map(({ item: info }) => {
            return {
                api_symbol: info.symbol,
                id: info.id,
                name: info.name,
                largeLogo: info.large,
                market_cap_rank: info.market_cap_rank,
                symbol: info.symbol,
                thumbnail: info.thumb,
                market: {
                    market_cap: +info.data.market_cap.replace(/(^\$|,)/g, ''),
                    current_price: info.data.price,
                    price_change_percentage_24h: info.data.price_change_percentage_24h.usd,
                },
            } satisfies TokenWithMarket;
        });
    }

    static async getTopMemeCoins() {
        const response = await fetchJson<CoinGeckoMemeCoinTrending[]>(
            urlcat(COINGECKO_ROOT_URL, '/coins/markets', {
                vs_currency: 'usd',
                category: 'meme-token',
                per_page: 50,
            }),
        );

        return response.map((x) => {
            return {
                api_symbol: x.symbol,
                id: x.id,
                name: x.name,
                largeLogo: x.image,
                market_cap_rank: x.market_cap_rank,
                symbol: x.symbol,
                thumbnail: x.image,
                market: {
                    current_price: x.current_price,
                    price_change_percentage_24h: x.price_change_percentage_24h,
                },
            } satisfies TokenWithMarket;
        });
    }

    static getChainIdByCoinId(coinId: string) {
        const CoinIdToChainId: Record<string, EthereumChainId> = {
            ethereum: EthereumChainId.Mainnet,
            'polygon-ecosystem-token': EthereumChainId.Polygon,
            binancecoin: EthereumChainId.BSC,
            fantom: EthereumChainId.Fantom,
            arbitrum: EthereumChainId.Arbitrum,
            scroll: EthereumChainId.Scroll,
            'avalanche-2': EthereumChainId.Avalanche,
        };
        return CoinIdToChainId[coinId];
    }

    static async getTokenByAddress(address: string, network: string, signal?: AbortSignal) {
        const url = urlcat(COINGECKO_ROOT_URL, '/onchain/networks/:network/tokens/:address', {
            address: address.toLowerCase(),
            network,
        });

        const response = await fetchJson<{ data: CoinGeckoAsset }>(url, {
            signal,
        });

        return response.data;
    }

    static async getTokenByAddressList(addresses: string[], network: string, signal?: AbortSignal) {
        const url = urlcat(COINGECKO_ROOT_URL, '/onchain/networks/:network/tokens/multi/:addresses', {
            addresses: addresses.join(','),
            network,
        });

        const response = await fetchJson<{ data: CoinGeckoAsset[] }>(url, {
            signal,
        });

        return response.data;
    }
}
