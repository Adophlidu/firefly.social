import { first } from '@dimensiondev/workers-shared/helpers/first.js';
import { isValidAddressSolana } from '@dimensiondev/workers-shared/helpers/isAddress.js';
import { SolanaChainId } from '@dimensiondev/workers-shared/types/solana.js';
import type { Context } from 'hono';

import { getCoinInfo } from '@/token/src/getCoinInfo.js';
import { getSingleCoin } from '@/token/src/getSingleCoin.js';
import { getTokens } from '@/token/src/getTokens.js';
import { isTokenMatched } from '@/token/src/isTokenMatched.js';
import { searchTokenByAddress } from '@/token/src/searchTokenByAddress.js';
import { searchTokenInfos } from '@/token/src/searchTokenInfos.js';
import type { CoinGeckoAsset, CoinGeckoToken, GetTokenOptions, SearchTokenInfo } from '@/token/src/types.js';

export async function searchToken(options: GetTokenOptions, c: Context): Promise<CoinGeckoToken | null> {
    let tokenAsset: CoinGeckoAsset | null = null;
    let searchTokenInfo: SearchTokenInfo | null | undefined = null;
    if (options.address) {
        tokenAsset = await searchTokenByAddress(options.address, c);
    }
    const isSolAddress = isValidAddressSolana(options.address);
    const chainId = isSolAddress ? SolanaChainId.Mainnet : options.chain_id;
    const isPrecise = !!(chainId && options.address);
    const symbol = options.token_symbol;
    if (!isPrecise && symbol && !options.coingecko_id) {
        const tokens = await getTokens(c);
        const token = tokens.find((x) => isTokenMatched(x, symbol));
        if (token) return token;
        const infos = await searchTokenInfos(symbol, false, c);
        searchTokenInfo = first(infos);
    }

    const updatedOptions = {
        ...options,
        chain_id: searchTokenInfo ? searchTokenInfo.chain_id : chainId,
        address: searchTokenInfo ? searchTokenInfo.contract_address : options.address,
    };
    const coin = await getSingleCoin(updatedOptions, c);
    const isRuntimePrecise = !!(updatedOptions.chain_id && updatedOptions.address);

    if (isRuntimePrecise && coin?.id) {
        return {
            id: coin.id,
            symbol: coin.symbol,
            chainId: updatedOptions.chain_id,
            address: coin.contract_address,
            name: coin.name,
            price: coin.market_data?.token_price_usd,
            changePercent24h: coin.market_data?.price_change_percentage_24h ?? undefined,
            type: 'FungibleToken',
            logoURL: coin.image.large,
            socialLinks: {
                website: coin.links.homepage[0] ?? '',
                twitter: coin.links.twitter_handle,
            },
            platform_info: coin.platform_info,
        };
    }
    const attributes = tokenAsset?.attributes;
    const coinId = options.coingecko_id || coin?.id || attributes?.coingecko_coin_id;
    const possibleCoinId = coinId || symbol;
    const marketToken = possibleCoinId ? await getCoinInfo(possibleCoinId, c) : null;

    if (marketToken && 'symbol' in marketToken) {
        return {
            id: marketToken.id,
            symbol: marketToken.symbol,
            address: marketToken.contract_address,
            name: marketToken.name,
            price: marketToken.market_data?.current_price?.usd,
            type: 'FungibleToken',
            logoURL: marketToken.image.large,
            rank: marketToken.market_cap_rank ?? marketToken.market_cap_rank_with_rehypothecated ?? undefined,
            socialLinks: {
                website: marketToken.links.homepage[0] ?? '',
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
            type: 'FungibleToken',
            logoURL: attributes.image_url,
        };
    }
    return null;
}
