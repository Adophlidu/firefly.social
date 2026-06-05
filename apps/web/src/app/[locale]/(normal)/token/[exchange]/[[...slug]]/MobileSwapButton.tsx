'use client';

import { memo } from 'react';

import { SwapButton, type SwapButtonProps } from '@/components/TokenProfile/SwapButton.js';
import { useTradeInfo } from '@/components/TokenProfile/useTradeInfo.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import type { CoinGeckoToken } from '@/providers/types/CoinGecko.js';

interface Props extends Omit<SwapButtonProps, 'swapProps'> {
    token: CoinGeckoToken;
}

export const MobileSwapButton = memo(function MobileSwapButton({ token, ...props }: Props) {
    const isLogin = useIsLoginFirefly();
    const tradeInfo = useTradeInfo(token);
    const tradeChainId = tradeInfo.chainId;
    if (!tradeInfo.tradable || !isLogin) return null;

    return (
        <SwapButton
            {...props}
            swapProps={
                tradeChainId
                    ? {
                          toToken: tradeInfo.address,
                          chainId: tradeChainId,
                      }
                    : undefined
            }
        />
    );
});
