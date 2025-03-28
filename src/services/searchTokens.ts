import { first } from 'lodash-es';

import { EMPTY_LIST } from '@/constants/index.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { createIndicator, createPageable, type Pageable, type PageIndicator } from '@/helpers/pageable.js';
import { trimify } from '@/helpers/trimify.js';
import { CoinGecko } from '@/providers/coingecko/index.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { CoinGeckoCoinMarketInfo } from '@/providers/types/CoinGecko.js';
import type { SearchableToken } from '@/providers/types/Firefly.js';
import { searchTokenByAddress } from '@/services/searchTokenByAddress.js';

export type TokenWithMarket = SearchableToken & { market?: Partial<CoinGeckoCoinMarketInfo>; hit?: boolean };

export function isTokenMatched<T extends { name: string; symbol: string }>(token: T, keyword: string) {
    return [token.name, token.symbol].some((x) => x.toLowerCase() === keyword.replace(/^\$/, '').toLowerCase());
}

function sortTokensByKeyword(tokens: SearchableToken[], keyword: string) {
    if (!tokens.length) return tokens;

    // fast path
    const [firstToken, ...rest] = tokens;
    if ((firstToken && isTokenMatched(firstToken, keyword)) || isValidAddressEthereum(trimify(keyword))) {
        return [{ ...firstToken, hit: true }, ...rest];
    }

    const matchedToken = first(
        tokens
            .filter((x) => isTokenMatched(x, keyword))
            .sort((a, b) => {
                if (!a.market_cap_rank || !b.market_cap_rank) {
                    return 0;
                }
                return a.market_cap_rank - b.market_cap_rank;
            }),
    );

    if (matchedToken) {
        return [{ ...matchedToken, hit: true }, ...tokens];
    }

    return tokens;
}

export async function searchTokensByAddress(address: string): Promise<Pageable<SearchableToken, PageIndicator>> {
    try {
        const token = await searchTokenByAddress(address);

        const attributes = token.attributes;
        return createPageable(
            [
                {
                    api_symbol: attributes.symbol,
                    id: attributes.coingecko_coin_id,
                    large: attributes.image_url,
                    name: attributes.name,
                    symbol: attributes.symbol,
                    thumb: attributes.image_url,
                },
            ],
            createIndicator(),
        );
    } catch {
        return createPageable(EMPTY_LIST, createIndicator());
    }
}

/**
 * Search by keyword or address
 */
export async function searchTokens(searchKeyword: string): Promise<Pageable<TokenWithMarket, PageIndicator>> {
    const trimmed = trimify(searchKeyword).toLowerCase();
    const res = isValidAddressEthereum(trimmed)
        ? await searchTokensByAddress(trimmed)
        : await FireflyEndpointProvider.searchTokens(searchKeyword);
    const ids = res.data.map((x) => x.id);
    const marketData = ids.length ? await CoinGecko.getCoinsByIds(ids) : [];

    return {
        ...res,
        data: sortTokensByKeyword(res.data || [], searchKeyword).map((x) => {
            const market = marketData.find((market) => market.id === x.id);
            return {
                ...x,
                market_cap_rank: x.market_cap_rank ?? market?.market_cap_rank,
                market,
            };
        }),
    };
}
