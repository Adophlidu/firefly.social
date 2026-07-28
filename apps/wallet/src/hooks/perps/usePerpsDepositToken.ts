import { useSearch } from '@dimensiondev/ssr';
import { isSolanaChain, solana } from '@dimensiondev/web3/chains';
import { isGreaterThan, multipliedBy } from '@dimensiondev/web3/numbers';
import { isNativeTokenOrSameAddress } from '@dimensiondev/web3/utils';
import { useQuery } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';
import { compact, first, orderBy } from 'lodash-es';

import { POLYMARKET_DEPOSIT_EVM_CHAIN_IDS } from '@/constants/ethereum.js';
import {
    ARBITRUM_CHAIN_ID,
    ARBITRUM_USDC_ADDRESS,
    arbUsdcTokenFallback,
    hyperliquidUsdcTokenFallback,
    MIN_HYPERLIQUID_DEPOSIT_USDC,
} from '@/constants/hyperliquid.js';
import { useSwapTokenDetail } from '@/hooks/swap/useSwapTokenDetail.js';
import { useEmbeddedWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import { useTokenBalance } from '@/hooks/useTokenBalance.js';
import { getSwapEndpoint } from '@/store/swapEndpoint.js';

interface SelectedToken {
    address?: string;
    chainId?: string;
}

export function usePerpsDepositToken() {
    const { address, chainId } = Object.fromEntries(useSearch()) as SelectedToken;
    const { evmAddress, solanaAddress } = useEmbeddedWalletAddresses();

    const { data: defaultToken, isLoading: isDefaultTokenLoading } = useQuery({
        queryKey: ['perps-deposit-default-token', evmAddress, solanaAddress],
        enabled: !!evmAddress && !!solanaAddress && !address,
        staleTime: 1000 * 60 * 5,
        retry: false,
        queryFn: async () => {
            if (!evmAddress || !solanaAddress) return [];

            const endpoint = getSwapEndpoint();
            const tokenMap = await endpoint.getUserTokenBalancesMultiChain(compact([evmAddress, solanaAddress]), [
                ...POLYMARKET_DEPOSIT_EVM_CHAIN_IDS,
                solana.id,
            ]);
            return [
                ...(tokenMap.get(evmAddress.toLowerCase()) || []),
                ...(tokenMap.get(solanaAddress.toLowerCase()) || []),
            ];
        },
        select: (data) => {
            if (!data?.length) return null;

            const arbUsdc = data.find(
                (token) =>
                    token.chainId === ARBITRUM_CHAIN_ID &&
                    isNativeTokenOrSameAddress(token.address, ARBITRUM_USDC_ADDRESS),
            );
            if (arbUsdc && isGreaterThan(arbUsdc.balance ?? '0', MIN_HYPERLIQUID_DEPOSIT_USDC)) {
                return arbUsdc;
            }

            const tokenWithMaxValue = first(
                orderBy(data, (token) => multipliedBy(token.balance ?? '0', token.price ?? 0).toNumber(), 'desc'),
            );
            if (
                tokenWithMaxValue &&
                isGreaterThan(
                    multipliedBy(tokenWithMaxValue.balance ?? '0', tokenWithMaxValue.price ?? 0),
                    MIN_HYPERLIQUID_DEPOSIT_USDC,
                )
            ) {
                return tokenWithMaxValue;
            }

            return null;
        },
    });

    const targetTokenAddress = isDefaultTokenLoading
        ? undefined
        : address || defaultToken?.address || ARBITRUM_USDC_ADDRESS;
    const targetTokenChainId = isDefaultTokenLoading
        ? undefined
        : chainId
          ? Number.parseInt(chainId, 10)
          : defaultToken?.chainId || ARBITRUM_CHAIN_ID;
    const { data, isLoading, error } = useSwapTokenDetail({
        address: targetTokenAddress,
        chainId: targetTokenChainId,
    });

    const token =
        isLoading || isDefaultTokenLoading
            ? null
            : error || !data
              ? {
                    id: ARBITRUM_USDC_ADDRESS,
                    address: ARBITRUM_USDC_ADDRESS,
                    decimals: arbUsdcTokenFallback.decimals,
                    chainId: ARBITRUM_CHAIN_ID,
                    logoUrl: arbUsdcTokenFallback.logoURI,
                    name: arbUsdcTokenFallback.name,
                    symbol: arbUsdcTokenFallback.symbol,
                    price: arbUsdcTokenFallback.price,
                }
              : {
                    id: data.address,
                    address: data.address,
                    decimals: data.decimals,
                    chainId: data.chainId,
                    logoUrl: data.logoURI,
                    name: data.name,
                    symbol: data.symbol,
                    price: data.price,
                };

    const walletAddress = !token ? null : isSolanaChain(token.chainId) ? solanaAddress : evmAddress;

    const { data: balanceData, isLoading: isBalanceLoading } = useTokenBalance({
        walletAddress,
        address: token?.id,
        chainId: token?.chainId,
        refetchInterval: 1000 * 40,
    });

    const balance = balanceData?.balance ?? '0';
    return {
        token: token
            ? {
                  ...token,
                  balance,
                  price: balanceData?.price ?? token.price ?? 0,
                  amount: new BigNumber(balance).toNumber(),
                  rawAmount: multipliedBy(balance, 10 ** token.decimals).toString(),
              }
            : null,
        isLoading,
        isBalanceLoading,
        isDefaultTokenLoading,
        receiveToken: hyperliquidUsdcTokenFallback,
    };
}
