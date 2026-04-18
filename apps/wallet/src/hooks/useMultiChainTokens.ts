import { EMPTY_LIST } from '@dimensiondev/constants';
import { solana, visibleChains } from '@dimensiondev/web3/chains';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { compact, omit } from 'lodash-es';

import { formatTokenFromFireflyTokenAsset } from '@/helpers/formatTokenFromFireflyTokenAsset.js';
import { useEmbeddedWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import { useCustomTokensWithBalance } from '@/hooks/useCustomTokensWithBalance.js';
import type { TokenAsset } from '@/providers/types/Firefly.js';
import { getMultiChainTokensQuery } from '@/queries/firefly/multiChainTokens.js';

export function useMultiChainTokens() {
    const { evmAddress, solanaAddress } = useEmbeddedWalletAddresses();
    const addresses = compact([evmAddress, solanaAddress]);
    const { data: customTokenAssets = [] } = useCustomTokensWithBalance();
    const enabled = addresses.length > 0;
    const chainIds = [...visibleChains.map((x) => x.id), solana.id];

    const options = {
        ...getMultiChainTokensQuery(addresses, chainIds),
        enabled,
        select: (
            data:
                | {
                      tokenAssets?: TokenAsset[];
                  }
                | undefined,
        ) => {
            if (!data?.tokenAssets) {
                return {
                    ...data,
                    tokenAssets: customTokenAssets,
                };
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
            return {
                ...data,
                tokenAssets: [...data.tokenAssets, ...newCustomTokenAssets],
            };
        },
    };
    return useQuery(options);
}

export function useSuspenseMultiChainTokens() {
    const { evmAddress, solanaAddress } = useEmbeddedWalletAddresses();
    const addresses = compact([evmAddress, solanaAddress]);
    const { data: customTokenAssets = [] } = useCustomTokensWithBalance();
    const chainIds = [...visibleChains.map((x) => x.id), solana.id];

    return useSuspenseQuery({
        ...omit(getMultiChainTokensQuery(addresses, chainIds), 'enabled'),
        select(data) {
            if (!data?.tokenAssets) {
                return customTokenAssets.map((token) => formatTokenFromFireflyTokenAsset(token)) ?? EMPTY_LIST;
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

            return allTokenAssets.map((token) => formatTokenFromFireflyTokenAsset(token)) ?? EMPTY_LIST;
        },
    });
}
