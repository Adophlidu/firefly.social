import { EMPTY_LIST } from '@dimensiondev/constants';
import { queryOptions } from '@tanstack/react-query';
import type { Address } from 'viem';
import { polygon } from 'viem/chains';

import { USDC_E_POLYGON_ADDRESS } from '@/constants/ethereum.js';
import { formatTokenFromFireflyTokenAsset } from '@/helpers/formatTokenFromFireflyTokenAsset.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import type { TokenAsset } from '@/providers/types/Firefly.js';
import { getMultiChainTokensQuery } from '@/queries/firefly/multiChainTokens.js';

/**
 * "Withdraw available" for Polymarket: proxy wallet's USDC (Polygon) balance.
 *
 * Returns a string amount (same shape as Token.amount).
 *
 * Note: This intentionally reuses `getMultiChainTokensQuery` so it shares cache keys
 * with other places that refetch `['multi-chain-token', proxy, polygon.id]`.
 */
export function getPolymarketWithdrawableAmountQueryOptions(proxyAddress: Address) {
    return queryOptions({
        ...getMultiChainTokensQuery([proxyAddress], [polygon.id]),
        select(result: { tokenAssets?: TokenAsset[] } | null | undefined) {
            const tokens =
                (result?.tokenAssets ?? []).map((token: TokenAsset) => formatTokenFromFireflyTokenAsset(token)) ??
                EMPTY_LIST;
            const token = tokens.find((token) => isSameAddress(token.id, USDC_E_POLYGON_ADDRESS));
            if (!token) return '0';
            return token.amount;
        },
    });
}
