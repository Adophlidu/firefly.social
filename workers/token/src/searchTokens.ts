import { compact } from '@dimensiondev/workers-shared/helpers/compact.js';
import { isValidAddress } from '@dimensiondev/workers-shared/helpers/isAddress.js';
import { trimify } from '@dimensiondev/workers-shared/helpers/trimify.js';
import type { Context } from 'hono';

import { getCoinMarketInfosByIds } from '@/token/src/getCoinsByIds.js';
import { searchTokenInfos } from '@/token/src/searchTokenInfos.js';
import { searchTokensByAddress } from '@/token/src/searchTokensByAddress.js';
import type { SearchableToken, TokenWithMarket } from '@/token/src/types.js';

async function searchByAddress(address: string, context: Context): Promise<SearchableToken[]> {
    try {
        const tokens = await searchTokensByAddress(address, context);
        return tokens.map((token) => {
            const attributes = token.attributes;
            return {
                api_symbol: attributes.symbol,
                id: attributes.coingecko_coin_id,
                chainId: token.attributes.chain_id || token.chain_id,
                address: token.attributes.address,
                largeLogo: attributes.image_url,
                name: attributes.name,
                symbol: attributes.symbol,
                thumbnail: attributes.image_url,
            } satisfies SearchableToken;
        });
    } catch {
        return [];
    }
}

async function searchByKeyword(keyword: string, fuzzy: boolean, context: Context): Promise<SearchableToken[]> {
    const infos = await searchTokenInfos(keyword, fuzzy, context);
    const tokens = infos.map((info) => {
        return {
            platform_type: info.platform_type,
            symbol: info.symbol,
            api_symbol: info.symbol,
            id: info.id || info.contract_address,
            chainId: info.chain_id,
            address: info.contract_address,
            largeLogo: info.image.large,
            name: info.name,
            thumbnail: info.image.thumb,
            fdv: info.market_data?.fully_diluted_valuation,
        } satisfies SearchableToken;
    });
    return tokens.sort((a, z) => {
        if (a.fdv === z.fdv) return 0;
        if (a.fdv === undefined) return 1;
        if (z.fdv === undefined) return -1;
        return z.fdv - a.fdv;
    });
}

/**
 * Search by keyword or address
 */
export async function searchTokens(
    searchKeyword: string,
    fuzzy: boolean,
    context: Context,
): Promise<TokenWithMarket[]> {
    const trimmed = trimify(searchKeyword);
    const tokens = isValidAddress(trimmed)
        ? await searchByAddress(trimmed, context)
        : await searchByKeyword(searchKeyword, fuzzy, context);
    const ids = compact(tokens.map((x) => x.id));
    const marketData = ids.length ? await getCoinMarketInfosByIds(ids, context) : [];

    return tokens.map((x) => {
        const market = marketData.find((market) => market.id === x.id);
        const marketCapRank =
            x.market_cap_rank ?? market?.market_cap_rank ?? market?.market_cap_rank_with_rehypothecated ?? null;
        return {
            ...x,
            market_cap_rank: marketCapRank,
            market,
        };
    });
}
