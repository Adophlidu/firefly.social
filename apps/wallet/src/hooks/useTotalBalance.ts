import { EMPTY_LIST } from '@dimensiondev/constants';
import { chains, solana } from '@dimensiondev/web3/chains';
import { useQuery } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';
import { compact } from 'lodash-es';

import { formatTokenFromFireflyTokenAsset } from '@/helpers/formatTokenFromFireflyTokenAsset.js';
import { plus } from '@/helpers/number.js';
import { useEmbeddedWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import { useCustomTokensWithBalance } from '@/hooks/useCustomTokensWithBalance.js';
import { getMultiChainTokensQuery } from '@/queries/firefly/multiChainTokens.js';

export function useTotalBalance() {
    const { evmAddress, solanaAddress } = useEmbeddedWalletAddresses();
    const addresses = compact([evmAddress, solanaAddress]);
    const { data: customTokenAssets = [] } = useCustomTokensWithBalance();

    return useQuery({
        ...getMultiChainTokensQuery(addresses, [...chains.map((x) => x.id), solana.id]),
        enabled: addresses.length === 2,
        select(data) {
            if (!data?.tokenAssets) {
                const tokens = customTokenAssets.map((token) => formatTokenFromFireflyTokenAsset(token));
                return tokens.reduce((acc, token) => plus(acc, token.usdValue), BigNumber(0)).toString();
            }

            // Create a set of existing token addresses (chainId:address) from API data
            const existingTokenKeys = new Set(
                data.tokenAssets.map((token) => `${token.chainIndex}:${token.tokenAddress.toLowerCase()}`),
            );

            // Filter out custom tokens that already exist in API data
            const newCustomTokenAssets = customTokenAssets.filter(
                (token) => !existingTokenKeys.has(`${token.chainIndex}:${token.tokenAddress.toLowerCase()}`),
            );

            // Merge custom tokens with API tokens
            const allTokenAssets = [...data.tokenAssets, ...newCustomTokenAssets];

            const tokens = allTokenAssets.map((token) => formatTokenFromFireflyTokenAsset(token)) ?? EMPTY_LIST;
            return tokens.reduce((acc, token) => plus(acc, token.usdValue), BigNumber(0)).toString();
        },
    });
}
