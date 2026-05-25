'use client';

import { isGreaterThan, leftShift, multipliedBy } from '@dimensiondev/web3/numbers';
import { Trans } from '@lingui/react/macro';
import type { BigNumber } from 'bignumber.js';
import { memo, useMemo } from 'react';

import { formatPrice } from '@/helpers/formatPrice.js';
import { getNativeToken } from '@/helpers/getNativeToken.js';
import { useNativeTokenPrice } from '@/hooks/useNativeTokenPrice.js';
import { useTipsStore } from '@/store/useTipsStore.js';

interface EstimatedCostProps {
    gas: BigNumber;
    canFreeGas?: boolean;
}

export const EstimatedCost = memo<EstimatedCostProps>(function EstimatedCost({ gas, canFreeGas }) {
    const { token, recipient, tokenAmount } = useTipsStore();

    const isValidGas = !canFreeGas && isGreaterThan(gas, 0);
    const { data } = useNativeTokenPrice(
        {
            chainId: token?.chainId,
            networkType: recipient?.networkType,
        },
        !!recipient && !!token && isValidGas,
    );

    const costUsdtValue = useMemo(() => {
        const nativeToken =
            token && recipient?.networkType ? getNativeToken(recipient.networkType, token.chainId) : null;
        const tokenUsdtValue = token?.price && tokenAmount ? multipliedBy(token.price, tokenAmount) : null;
        const gasUsdtValue =
            !canFreeGas && data && isValidGas && nativeToken
                ? leftShift(gas, nativeToken.decimals).multipliedBy(data)
                : null;

        return tokenUsdtValue ? tokenUsdtValue.plus(gasUsdtValue || 0) : null;
    }, [data, token, isValidGas, gas, recipient?.networkType, tokenAmount, canFreeGas]);

    return (
        <p className="mt-4 flex h-5 items-center justify-between text-sm">
            <span className="text-second">
                <Trans>Estimated cost</Trans>
            </span>
            <span className="font-medium text-main">
                {!costUsdtValue ? '-' : `$${formatPrice(costUsdtValue.toString())}`}
            </span>
        </p>
    );
});
