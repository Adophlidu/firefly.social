import { compact } from 'lodash-es';

import { isValidAddress } from '@/helpers/isValidAddress.js';
import { trimify } from '@/helpers/trimify.js';
import { CoinGecko } from '@/providers/coingecko/index.js';
import { searchTokenInfos } from '@/providers/firefly/endpoints/searchTokenInfos.js';
import type { CoinGeckoCoinMarketInfo } from '@/providers/types/CoinGecko.js';
import type { SearchableToken } from '@/providers/types/Firefly.js';
import { searchTokensByAddress } from '@/services/searchTokensByAddress.js';

export type TokenWithMarket = SearchableToken & { market?: Partial<CoinGeckoCoinMarketInfo> };

export function isTokenMatched<T extends { name: string; symbol: string }>(token: T, keyword: string) {
    return [token.name, token.symbol].some((x) => x.toLowerCase() === keyword.replace(/^\$/, '').toLowerCase());
}

async function searchByAddress(address: string): Promise<SearchableToken[]> {
    try {
        const tokens = await searchTokensByAddress(address);

        return tokens.map((token) => {
            const attributes = token.attributes;
            return {
                api_symbol: attributes.symbol,
                id: attributes.coingecko_coin_id || attributes.address,
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

async function searchByKeyword(keyword: string, fuzzy?: boolean): Promise<SearchableToken[]> {
    const infos = await searchTokenInfos(keyword, fuzzy);
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
    return tokens;
}

/**
 * Search by keyword or address
 */
export async function searchTokens(searchKeyword: string, fuzzy?: boolean): Promise<TokenWithMarket[]> {
    const trimmed = trimify(searchKeyword);
    const tokens = isValidAddress(trimmed)
        ? await searchByAddress(trimmed)
        : await searchByKeyword(searchKeyword, fuzzy);
    const ids = compact(tokens.map((x) => x.id));
    const marketData = ids.length ? await CoinGecko.getCoinsByIds(ids) : [];

    return tokens.map((x) => {
        const market = marketData.find((market) => market.id === x.id);
        return {
            ...x,
            market_cap_rank: x.market_cap_rank ?? market?.market_cap_rank,
            market,
        };
    });
}
