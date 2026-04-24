import { isSolanaChain, solana } from '@dimensiondev/web3/chains';
import { NetworkType } from '@dimensiondev/web3/enums';
import { isGreaterThan, multipliedBy } from '@dimensiondev/web3/numbers';
import { isNativeTokenOrSameAddress } from '@dimensiondev/web3/utils';
import { useQuery } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';
import { BigNumber } from 'bignumber.js';
import { compact, first, orderBy } from 'lodash-es';
import { polygon } from 'viem/chains';

import { P_USDC_POLYGON_ADDRESS as P_USD_POLYGON_ADDRESS, SUPPORTED_SWAP_EVM_CHAIN_IDS } from '@/constants/ethereum.js';
import { BET_DEPOSIT_MIN_USD } from '@/constants/static.js';
import { useSwapTokenDetail } from '@/hooks/swap/useSwapTokenDetail.js';
import { useEmbeddedWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import { useTokenBalance } from '@/hooks/useTokenBalance.js';
import { createSwapEndpoint } from '@/providers/swap/swapEndpoint.js';

interface SelectedToken {
    address?: string;
    chainId?: string;
}

export const pusdTokenFallback = {
    amount: 0,
    decimals: 6,
    id: P_USD_POLYGON_ADDRESS,
    address: P_USD_POLYGON_ADDRESS,
    logoUrl: 'https://polygonscan.com/token/images/polymarket_poly.svg',
    name: 'Polymarket USD',
    price: 1,
    rawAmount: '0',
    rawAmountHexStr: '0x0',
    symbol: 'pUSD',
    chainId: polygon.id,
    balance: '0',
    usdValue: 1,
    networkType: NetworkType.Ethereum,
};

export function useWithdrawToken() {
    const { address, chainId } = useSearch({ from: '/bet/withdraw' }) as SelectedToken;
    const { data, isLoading, error } = useSwapTokenDetail({
        address: address || pusdTokenFallback.id,
        chainId: chainId ? Number.parseInt(chainId, 10) : pusdTokenFallback.chainId,
    });

    if (isLoading) return { token: null, isLoading };
    if (error || !data) return { token: pusdTokenFallback, isLoading: false };

    return {
        token: {
            id: data.address,
            decimals: data.decimals,
            chainId: data.chainId,
            logoUrl: data.logoURI || pusdTokenFallback.logoUrl,
            name: data.name,
            symbol: data.symbol,
            price: data.price,
        },
    };
}

export function useDepositToken() {
    const { address, chainId } = useSearch({ from: '/bet/deposit' }) as SelectedToken;
    const { evmAddress, solanaAddress } = useEmbeddedWalletAddresses();

    const { data: defaultToken, isLoading: isDefaultTokenLoading } = useQuery({
        queryKey: ['swap-user-tokens', evmAddress, solanaAddress],
        enabled: !!evmAddress && !!solanaAddress && !address,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: false,
        queryFn: async () => {
            if (!evmAddress || !solanaAddress) return [];

            const endpoint = createSwapEndpoint();
            const tokenMap = await endpoint.getUserTokenBalancesMultiChain(compact([evmAddress, solanaAddress]), [
                ...SUPPORTED_SWAP_EVM_CHAIN_IDS,
                solana.id,
            ]);
            return [
                ...(tokenMap.get(evmAddress.toLowerCase()) || []),
                ...(tokenMap.get(solanaAddress.toLowerCase()) || []),
            ];
        },
        select: (data) => {
            if (!data?.length) return null;

            const polygonUsdc = data.find(
                (token) =>
                    token.chainId === pusdTokenFallback.chainId &&
                    isNativeTokenOrSameAddress(token.address, pusdTokenFallback.address),
            );
            if (polygonUsdc && isGreaterThan(polygonUsdc.balance ?? '0', BET_DEPOSIT_MIN_USD)) {
                return polygonUsdc;
            }

            const tokenWithMaxValue = first(
                orderBy(data, (token) => multipliedBy(token.balance ?? '0', token.price ?? 0).toNumber(), 'desc'),
            );
            if (
                tokenWithMaxValue &&
                isGreaterThan(
                    multipliedBy(tokenWithMaxValue.balance ?? '0', tokenWithMaxValue.price ?? 0),
                    BET_DEPOSIT_MIN_USD,
                )
            )
                return tokenWithMaxValue;

            return null;
        },
    });

    const targetTokenAddress = isDefaultTokenLoading
        ? undefined
        : address || defaultToken?.address || pusdTokenFallback.id;
    const targetTokenChainId = isDefaultTokenLoading
        ? undefined
        : chainId
          ? Number.parseInt(chainId, 10)
          : defaultToken?.chainId || pusdTokenFallback.chainId;
    const { data, isLoading, error } = useSwapTokenDetail({
        address: targetTokenAddress,
        chainId: targetTokenChainId,
    });

    const token =
        isLoading || isDefaultTokenLoading
            ? null
            : error || !data
              ? pusdTokenFallback
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
        refetchInterval: 1000 * 40, // 40 seconds
    });

    const balance = balanceData?.balance ?? '0';
    return {
        token: token
            ? {
                  ...token,
                  balance,
                  price: balanceData?.price ?? token?.price ?? 0,
                  amount: new BigNumber(balance).toNumber(),
                  rawAmount: multipliedBy(balance, 10 ** token.decimals).toString(),
              }
            : null,
        isLoading,
        isBalanceLoading,
        isDefaultTokenLoading,
    };
}
