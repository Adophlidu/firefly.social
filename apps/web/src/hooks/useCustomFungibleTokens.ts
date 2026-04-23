import { runInSafeAsync } from '@dimensiondev/utils';
import { resolveWagmiChain } from '@dimensiondev/web3/chains';
import { leftShift } from '@dimensiondev/web3/numbers';
import { useQueries } from '@tanstack/react-query';
import { compact, uniq } from 'lodash-es';
import { erc20Abi } from 'viem';
import { useConnection } from 'wagmi';
import { multicall } from 'wagmi/actions';
import { useShallow } from 'zustand/shallow';

import { queryClient } from '@/configs/queryClient.js';
import { wagmiConfig } from '@/configs/wagmiClient.js';
import { formatCustomTokenToTipsToken } from '@/helpers/formatCustomTokenToTipsToken.js';
import { removeTrailingZeros } from '@/helpers/removeTrailingZeros.js';
import { getFungibleTokenPrice } from '@/providers/coingecko/getFungibleTokenPrice.js';
import type { Token as TipsToken } from '@/providers/types/Transfer.js';
import { CustomTokenType, useCustomTokenStore } from '@/store/useCustomTokenStore.js';

export interface Token extends TipsToken {
    custom?: boolean;
}

export function useCustomFungibleTokens(chainId?: number) {
    const tokens = useCustomTokenStore(
        useShallow((state) =>
            Object.values(state.tokens)
                .filter((x) => x.type === CustomTokenType.ERC20)
                .filter((x) => (chainId ? x.chainId === chainId : true)),
        ),
    );
    const account = useConnection();
    return useQueries({
        queries: uniq(tokens.map((x) => x.chainId)).map((chainId) => {
            const tokensByChainId = tokens.filter((x) => x.chainId === chainId);
            return {
                queryKey: ['custom-fungible-tokens', account.address?.toLowerCase(), chainId, tokensByChainId],
                async queryFn() {
                    if (!account.address) return;
                    const contracts = tokensByChainId.map((x) => {
                        return {
                            abi: erc20Abi,
                            functionName: 'balanceOf',
                            address: x.address,
                            args: [account.address!],
                        };
                    });
                    const result = await multicall(wagmiConfig, {
                        contracts,
                        chainId,
                    });

                    const chain = resolveWagmiChain(chainId);

                    const formattedTokens = result.map(async (x, i) => {
                        const token = tokensByChainId[i];
                        if (!token || x.status !== 'success') return;
                        const balance = x.result as bigint;
                        const bigUnitBalance = leftShift(`${balance}`, token.decimals);
                        let usdValue: number | undefined;
                        await runInSafeAsync(async () => {
                            if (chain) {
                                const price = await queryClient.ensureQueryData({
                                    queryKey: ['fungible', 'token-price', chainId, token.address.toLowerCase()],
                                    queryFn: () => getFungibleTokenPrice(chainId, token.address),
                                });
                                if (price) {
                                    usdValue = bigUnitBalance.times(price).toNumber();
                                }
                            }
                        });
                        return formatCustomTokenToTipsToken<Token>(token, {
                            balance: removeTrailingZeros(bigUnitBalance.toFormat(4)),
                            amount: bigUnitBalance.toNumber(),
                            raw_amount: balance.toString(),
                            raw_amount_hex_str: balance.toString(16),
                            custom: true,
                            usdValue,
                        });
                    });
                    return compact(await Promise.all(formattedTokens));
                },
            };
        }),
        combine(result) {
            return compact(result.flatMap((x) => x.data));
        },
    });
}
