import { isNativeTokenOrSameAddress } from '@dimensiondev/web3/utils';

import { getDefaultSwapToken } from '@/providers/swap/defaultTokens.js';
import type { SwapToken } from '@/providers/swap/types.js';

const ETH_LIKE_NATIVE_TOKEN_NAMES = new Set(['eth', 'ether', 'ethereum']);

function shouldNormalizeNativeTokenName(token: SwapToken, expectedSymbol: string): boolean {
    const name = token.name?.trim();
    if (!name) return true;

    const normalizedName = name.toLowerCase();
    const normalizedSymbol = token.symbol.trim().toLowerCase();
    const expected = expectedSymbol.trim().toLowerCase();

    if (normalizedName === normalizedSymbol) return true;
    if (normalizedSymbol !== expected && ETH_LIKE_NATIVE_TOKEN_NAMES.has(normalizedName)) return true;

    return false;
}

export function normalizeSwapToken(token: SwapToken): SwapToken {
    const defaults = getDefaultSwapToken(token.chainId);
    if (!defaults) return token;
    if (!isNativeTokenOrSameAddress(token.address, defaults.first.contractAddress)) return token;

    const normalizedSymbol = defaults.first.symbol;

    return {
        ...token,
        symbol: normalizedSymbol,
        name: shouldNormalizeNativeTokenName(token, normalizedSymbol) ? normalizedSymbol : token.name,
    };
}
