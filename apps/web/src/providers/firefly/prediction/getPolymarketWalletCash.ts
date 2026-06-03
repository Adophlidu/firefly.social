import { EMPTY_LIST } from '@dimensiondev/constants';
import { isSameAddress } from '@dimensiondev/web3/utils';
import { BigNumber } from 'bignumber.js';
import type { Address } from 'viem';
import { polygon } from 'viem/chains';

import { P_USDC_POLYGON_ADDRESS } from '@/constants/bets.js';
import { formatTokenFromFireflyTokenAsset } from '@/helpers/formatTokenFromFireflyTokenAsset.js';
import { getMultiChainTokenList } from '@/providers/firefly/endpoint/getMultiChainTokenList.js';

export async function getPolymarketWalletCash(proxyAddress: Address) {
    const tokenAssets = await getMultiChainTokenList([proxyAddress], [polygon.id]);
    const tokens = (tokenAssets ?? EMPTY_LIST).map((token) => formatTokenFromFireflyTokenAsset(token));
    const cash = tokens.find((token) => isSameAddress(token.id, P_USDC_POLYGON_ADDRESS));

    return BigNumber(cash?.amount ?? 0).toString();
}
