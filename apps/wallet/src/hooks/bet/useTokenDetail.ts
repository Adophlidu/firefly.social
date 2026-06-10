import { BET_DEPOSIT_MIN_USD } from '@dimensiondev/constants/static';
import { NetworkType } from '@dimensiondev/enums';
import { isSolanaChain, solana } from '@dimensiondev/web3/chains';
import { isGreaterThan, multipliedBy } from '@dimensiondev/web3/numbers';
import { isNativeTokenOrSameAddress } from '@dimensiondev/web3/utils';
import { useQuery } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';
import { BigNumber } from 'bignumber.js';
import { compact, first, orderBy } from 'lodash-es';
import { polygon } from 'viem/chains';

import {
    P_USDC_POLYGON_ADDRESS as P_USD_POLYGON_ADDRESS,
    POLYMARKET_DEPOSIT_EVM_CHAIN_IDS,
} from '@/constants/ethereum.js';
import { useSwapTokenDetail } from '@/hooks/swap/useSwapTokenDetail.js';
import { useEmbeddedWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import { useTokenBalance } from '@/hooks/useTokenBalance.js';
import type { WithdrawSupportedToken } from '@/providers/types/Firefly.js';
import { getSwapEndpoint } from '@/store/swapEndpoint.js';

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

export const usdcPolygonTokenFallback = {
    amount: 0,
    decimals: 6,
    id: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    logoUrl: 'https://sdk-cdn.fun.xyz/images/usdc.svg',
    name: 'USD Coin',
    price: 1,
    rawAmount: '0',
    rawAmountHexStr: '0x0',
    symbol: 'USDC',
    chainId: polygon.id,
    balance: '0',
    usdValue: 1,
    networkType: NetworkType.Ethereum,
};

export function useWithdrawToken(supportedTokens?: WithdrawSupportedToken[]) {
    const { address, chainId } = useSearch({ from: '/bet/withdraw' }) as SelectedToken;

    const isValidSelection =
        supportedTokens && address
            ? supportedTokens.some(
                  (t) =>
                      t.token_address.toLowerCase() === address.toLowerCase() &&
                      t.chain_id === (chainId ? Number.parseInt(chainId, 10) : usdcPolygonTokenFallback.chainId),
              )
            : true;

    const targetAddress = isValidSelection ? address || usdcPolygonTokenFallback.id : usdcPolygonTokenFallback.id;
    const targetChainId = isValidSelection
        ? chainId
            ? Number.parseInt(chainId, 10)
            : usdcPolygonTokenFallback.chainId
        : usdcPolygonTokenFallback.chainId;

    const { data, isLoading, error } = useSwapTokenDetail({
        address: targetAddress,
        chainId: targetChainId,
    });

    if (isLoading) return { token: null, isLoading };
    if (error || !data) return { token: usdcPolygonTokenFallback, isLoading: false };

    return {
        token: {
            id: data.address,
            decimals: data.decimals,
            chainId: data.chainId,
            logoUrl: data.logoURI || usdcPolygonTokenFallback.logoUrl,
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

            const polygonUsdc = data.find(
                (token) =>
                    token.chainId === usdcPolygonTokenFallback.chainId &&
                    isNativeTokenOrSameAddress(token.address, usdcPolygonTokenFallback.address),
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
        : address || defaultToken?.address || usdcPolygonTokenFallback.id;
    const targetTokenChainId = isDefaultTokenLoading
        ? undefined
        : chainId
          ? Number.parseInt(chainId, 10)
          : defaultToken?.chainId || usdcPolygonTokenFallback.chainId;
    const { data, isLoading, error } = useSwapTokenDetail({
        address: targetTokenAddress,
        chainId: targetTokenChainId,
    });

    const token =
        isLoading || isDefaultTokenLoading
            ? null
            : error || !data
              ? usdcPolygonTokenFallback
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
