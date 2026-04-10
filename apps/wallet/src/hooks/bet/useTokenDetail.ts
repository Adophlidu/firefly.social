import { useSearch } from '@tanstack/react-router';
import { BigNumber } from 'bignumber.js';
import { polygon } from 'viem/chains';

import { NetworkType } from '@/constants/enum.js';
import { USDC_E_POLYGON_ADDRESS } from '@/constants/ethereum.js';
import { isSolanaChain } from '@/helpers/isSolanaChain.js';
import { multipliedBy } from '@/helpers/number.js';
import { useSwapTokenDetail } from '@/hooks/swap/useSwapTokenDetail.js';
import { useEmbeddedWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import { useTokenBalance } from '@/hooks/useTokenBalance.js';

interface SelectedToken {
    address?: string;
    chainId?: string;
}

export const usdcTokenFallback = {
    amount: 0,
    decimals: 6,
    id: USDC_E_POLYGON_ADDRESS,
    address: USDC_E_POLYGON_ADDRESS,
    logoUrl: 'https://cdn.zerion.io/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
    name: 'USDC',
    price: 1,
    rawAmount: '0',
    rawAmountHexStr: '0x0',
    symbol: 'USDC',
    chainId: polygon.id,
    balance: '0',
    usdValue: 1,
    networkType: NetworkType.Ethereum,
};

export function useWithdrawToken() {
    const { address, chainId } = useSearch({ from: '/bet/withdraw' }) as SelectedToken;
    const { data, isLoading, error } = useSwapTokenDetail({
        address: address || usdcTokenFallback.id,
        chainId: chainId ? parseInt(chainId, 10) : usdcTokenFallback.chainId,
    });

    if (isLoading) return { token: null, isLoading };
    if (error || !data) return { token: usdcTokenFallback, isLoading: false };

    return {
        token: {
            id: data.address,
            decimals: data.decimals,
            chainId: data.chainId,
            logoUrl: data.logoURI,
            name: data.name,
            symbol: data.symbol,
            price: data.price,
        },
    };
}

export function useDepositToken() {
    const { address, chainId } = useSearch({ from: '/bet/deposit' }) as SelectedToken;
    const { evmAddress, solanaAddress } = useEmbeddedWalletAddresses();

    const { data, isLoading, error } = useSwapTokenDetail({
        address: address || usdcTokenFallback.id,
        chainId: chainId ? parseInt(chainId, 10) : usdcTokenFallback.chainId,
    });

    const token = isLoading
        ? null
        : error || !data
          ? usdcTokenFallback
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
    };
}
