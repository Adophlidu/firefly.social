import { memoizePromise } from '@/helpers/memoizePromise.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { CoinGecko } from '@/providers/coingecko/index.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { CoinGeckoToken } from '@/providers/types/CoinGecko.js';
import { isTokenMatched } from '@/services/searchTokens.js';

const getTokens = memoizePromise(CoinGecko.getTokens, () => 'CoinGecko.getTokens');

export const getTokenFromCoinGecko = memoizePromise(
    async (symbolOrId: string): Promise<CoinGeckoToken | undefined> => {
        const tokens = await getTokens();
        const token = tokens.find((x) => isTokenMatched(x, symbolOrId));
        if (!token) {
            const data = await runInSafeAsync(() => FireflyEndpointProvider.getTokenBySymbol(symbolOrId));
            const marketToken = await runInSafeAsync(() => CoinGecko.getCoinInfo(data?.id ?? symbolOrId));
            if (marketToken && 'symbol' in marketToken) {
                return {
                    id: marketToken.id,
                    symbol: marketToken.symbol,
                    name: marketToken.name,
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
        }

        return token;
    },
    (symbolOrId) => symbolOrId,
);
