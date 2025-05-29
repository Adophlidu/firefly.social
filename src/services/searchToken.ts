import { isValidAddressSolana } from '@/helpers/isValidAddress.js';
import { memoizePromise } from '@/helpers/memoizePromise.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { SolanaChainId } from '@/mask_pkgs/web3-shared/solana/types.js';
import { CoinGecko } from '@/providers/coingecko/index.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { CoinGeckoAsset, CoinGeckoToken } from '@/providers/types/CoinGecko.js';
import type { GetTokenOptions } from '@/providers/types/Firefly.js';
import { searchTokenByAddress } from '@/services/searchTokenByAddress.js';
import { isTokenMatched } from '@/services/searchTokens.js';

const getTokens = memoizePromise(CoinGecko.getTokens, () => 'CoinGecko.getTokens');

export const searchToken = memoizePromise(
    async function searchToken(options: GetTokenOptions): Promise<CoinGeckoToken | null> {
        let tokenAsset: CoinGeckoAsset | null = null;
        if (options.address) {
            tokenAsset = await searchTokenByAddress(options.address);
        }
        const isSolAddress = isValidAddressSolana(options.address);
        const chainId = isSolAddress ? SolanaChainId.Mainnet : options.chain_id;
        const isPrecise = !!(chainId && options.address);
        const symbol = options.token_symbol;
        if (!isPrecise && symbol && !options.coingecko_id) {
            const tokens = await getTokens();
            const token = tokens.find((x) => isTokenMatched(x, symbol));
            if (token) return token;
        }

        const coin = await FireflyEndpointProvider.getSingleCoin({
            ...options,
            chain_id: chainId,
        });

        if (isPrecise && coin && !coin.id) {
            return {
                id: coin.id,
                symbol: coin.symbol,
                address: coin.contract_address,
                name: coin.name,
                price: coin.market_data?.token_price_usd,
                changePercent24h: coin.market_data?.price_change_percentage_24h ?? undefined,
                source: 'CoinGecko',
                type: 'FungibleToken',
                logoURL: coin.image.large,
                socialLinks: {
                    website: coin.links.homepage[0],
                    twitter: coin.links.twitter_handle,
                },
                platform_info: coin.platform_info,
            };
        }
        const attributes = tokenAsset?.attributes;
        const coinId = options.coingecko_id || coin?.id || attributes?.coingecko_coin_id || symbol;
        const marketToken = await runInSafeAsync(async () => (coinId ? await CoinGecko.getCoinInfo(coinId) : null));

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
                platform_info: coin?.platform_info,
            };
        }

        if (attributes) {
            return {
                id: coinId || null,
                chainId: attributes.chain_id,
                address: attributes.address,
                symbol: attributes.symbol,
                name: attributes.name,
                source: 'CoinGecko',
                type: 'FungibleToken',
                logoURL: attributes.image_url,
            };
        }
        return null;
    },
    (options) => JSON.stringify(options),
);
