import { memoizePromise } from '@/helpers/memoizePromise.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { CoinGecko } from '@/providers/coingecko/index.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { CoinGeckoToken } from '@/providers/types/CoinGecko.js';

export const getTokenFromCoinGecko = memoizePromise(
    async (symbolOrId: string, options?: Record<string, any>): Promise<CoinGeckoToken | undefined> => {
        const data = await runInSafeAsync(() => {
            return FireflyEndpointProvider.getSingleCoin({ ...options, token_symbol: symbolOrId });
        });
        if (options?.chain_id && options.address && data && !data.id) {
            return {
                id: data.id,
                symbol: data.symbol,
                address: data.contract_address,
                name: data.name,
                price: data.market_data?.token_price_usd,
                changePercent24h: data.market_data?.price_change_percentage_24h ?? undefined,
                source: 'CoinGecko',
                type: 'FungibleToken',
                logoURL: data.image.large,
                socialLinks: {
                    website: data.links.homepage[0],
                    twitter: data.links.twitter_handle,
                },
            };
        }
        const marketToken = await runInSafeAsync(() => CoinGecko.getCoinInfo(data?.id ?? symbolOrId));
        if (marketToken && 'symbol' in marketToken) {
            return {
                id: marketToken.id,
                symbol: marketToken.symbol,
                address: marketToken.contract_address,
                name: marketToken.name,
                price: marketToken.market_data?.current_price?.usd,
                source: 'CoinGecko',
                type: 'FungibleToken',
                logoURL: marketToken.image.large,
                rank: marketToken.market_cap_rank,
                socialLinks: {
                    website: marketToken.links.homepage[0],
                    twitter: marketToken.links.twitter_screen_name,
                    telegram: marketToken.links.telegram_channel_identifier,
                },
            };
        }
        return undefined;
    },
    (symbolOrId, options) => `${symbolOrId}/${JSON.stringify(options)}`,
);
