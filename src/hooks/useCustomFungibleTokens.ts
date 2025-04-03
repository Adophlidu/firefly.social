import { EthereumChainId } from '@masknet/web3-shared-evm';
import { useQueries } from '@tanstack/react-query';
import { compact, uniq } from 'lodash-es';
import { erc20Abi } from 'viem';
import { useAccount } from 'wagmi';
import { multicall } from 'wagmi/actions';

import { config } from '@/configs/wagmiClient.js';
import { formatCustomTokenToTipsToken } from '@/helpers/formatCustomTokenToTipsToken.js';
import { removeTrailingZeros } from '@/helpers/formatMarketCap.js';
import { leftShift } from '@/helpers/number.js';
import type { Token as TipsToken } from '@/providers/types/Transfer.js';
import { CustomTokenType, useCustomTokenStore } from '@/store/useCustomTokenStore.js';

export interface Token extends TipsToken {
    custom?: boolean;
}

export function useCustomFungibleTokens(chainId?: EthereumChainId) {
    const tokens = useCustomTokenStore((state) =>
        Object.values(state.tokens)
            .filter((x) => x.type === CustomTokenType.ERC20)
            .filter((x) => (chainId ? x.chainId === chainId : true)),
    );
    const account = useAccount();
    return useQueries({
        queries: uniq(tokens.map((x) => x.chainId)).map((chainId) => {
            const tokensByChainId = tokens.filter((x) => x.chainId === chainId);
            return {
                queryKey: ['custom-fungible-tokens', account.address, chainId, tokensByChainId],
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
                    const result = await multicall(config, {
                        contracts,
                        chainId,
                    });
                    const formattedTokens = result.map((x, i) => {
                        const token = tokensByChainId[i];
                        if (!token || x.status !== 'success') return;
                        const balance = x.result as bigint;
                        const bigUnitBalance = leftShift(`${balance}`, token.decimals);
                        return formatCustomTokenToTipsToken<Token>(token, {
                            balance: bigUnitBalance.isZero() ? '' : removeTrailingZeros(bigUnitBalance.toFormat(4)),
                            amount: bigUnitBalance.toNumber(),
                            raw_amount: balance.toString(),
                            raw_amount_hex_str: balance.toString(16),
                            custom: true,
                        });
                    });
                    return compact(formattedTokens);
                },
            };
        }),
        combine(result) {
            return compact(result.flatMap((x) => x.data));
        },
    });
}
