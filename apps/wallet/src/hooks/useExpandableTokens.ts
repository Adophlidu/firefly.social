import { useMemo, useState } from 'react';

import { isGreaterThan, isLessThan } from '@/helpers/number.js';
import type { Token } from '@/providers/types/Transfer.js';

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
    const filteredTokens: Token[] = useMemo(() => {
        let allTokens = tokens;
        if (chainId) {
            allTokens = allTokens.filter((token) => token.chainId === chainId);
        }
        if (keyword) {
            const kw = keyword.toLocaleLowerCase();
            allTokens = allTokens.filter(
                (token) =>
                    [token.name, token.symbol].some((value) => value.toLowerCase().includes(kw)) ||
                    token.id.toLocaleLowerCase() === kw,
            );
        }
        allTokens.sort((a, b) => b.usdValue - a.usdValue);
        return allTokens;
    }, [chainId, keyword, tokens]);
    const canExpand = useMemo(() => {
        if (keyword || chainId) return false;
        return (
            filteredTokens.some((token) => isGreaterThan(token.usdValue, 1)) &&
            filteredTokens.some((token) => isLessThan(token.usdValue, 1))
        );
    }, [chainId, filteredTokens, keyword]);

    const highValueTokens = filteredTokens.filter((token) => isGreaterThan(token.usdValue, 1));
    const lowValueTokens = filteredTokens.filter((token) => isLessThan(token.usdValue, 1));

    const data = showSmall || !canExpand ? [...highValueTokens, ...lowValueTokens] : highValueTokens;

    return {
        tokens: data,
        setShowSmall,
        canExpand,
        showSmall,
    };
}
