import { useMemo, useState } from 'react';

import { isGreaterThan, isLessThan } from '@/helpers/number.js';
import { type Token, useCustomFungibleTokens } from '@/hooks/useCustomFungibleTokens.js';

export function useExpandableTokens(
    tokens: Token[],
    options?: {
        chainId?: number;
        keyword?: string;
    },
) {
    const chainId = options?.chainId;
    const keyword = options?.keyword;
    const [showSmall, setShowSmall] = useState(false);
    const customTokens = useCustomFungibleTokens();
    const filteredTokens: Token[] = useMemo(() => {
        let allTokens = [...customTokens, ...tokens];
        if (chainId) {
            allTokens = allTokens.filter((token) => token.chainId === chainId);
        }
        if (keyword) {
            const kw = keyword.toLocaleLowerCase();
            allTokens = allTokens.filter((token) =>
                [token.name, token.symbol, token.id].some((value) => value.toLowerCase().includes(kw)),
            );
        }
        return allTokens;
    }, [chainId, keyword, tokens, customTokens]);
    const canExpand = useMemo(() => {
        if (keyword || chainId) return false;
        return (
            filteredTokens.some((token) => isGreaterThan(token.usdValue, 1) && !token.custom) &&
            filteredTokens.some((token) => isLessThan(token.usdValue, 1) && !token.custom)
        );
    }, [chainId, filteredTokens, keyword]);

    const highValueTokens = filteredTokens.filter((token) => (token.custom ? true : isGreaterThan(token.usdValue, 1)));
    const lowValueTokens = filteredTokens.filter((token) => (token.custom ? false : isLessThan(token.usdValue, 1)));

    const data = showSmall || !canExpand ? [...highValueTokens, ...lowValueTokens] : highValueTokens;

    return {
        tokens: data,
        setShowSmall,
        canExpand,
        showSmall,
    };
}
