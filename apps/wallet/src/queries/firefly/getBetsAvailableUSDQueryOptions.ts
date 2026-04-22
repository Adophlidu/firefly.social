import { EMPTY_LIST } from '@dimensiondev/constants';
import { isSameAddress } from '@dimensiondev/web3/utils';
import { queryOptions } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';
import type { Address } from 'viem';
import { polygon } from 'viem/chains';

import { P_USDC_POLYGON_ADDRESS } from '@/constants/ethereum.js';
import { formatTokenFromFireflyTokenAsset } from '@/helpers/formatTokenFromFireflyTokenAsset.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export function getBetsAvailableUSDQueryOptions(proxyAddress: Address) {
    return queryOptions({
        // Keep the same key shape as `getMultiChainTokensQuery([proxyAddress], [polygon.id])` to reuse cache.
        queryKey: ['multi-chain-token', proxyAddress.toLowerCase(), polygon.id],
        async queryFn() {
            return getFireflyEndpoint().getMultiChainTokenList([proxyAddress], [polygon.id]);
        },
        select(res) {
            const tokens =
                (res?.tokenAssets ?? []).map((token) => formatTokenFromFireflyTokenAsset(token)) ?? EMPTY_LIST;
            const usdc = tokens.find((token) => isSameAddress(token.id, P_USDC_POLYGON_ADDRESS));
            return usdc ? BigNumber(usdc.amount).toString() : '0';
        },
    });
}
