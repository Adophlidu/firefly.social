import { removeTrailingZeros } from '@dimensiondev/utils';
import { dividedBy, multipliedBy, toFixed } from '@dimensiondev/web3/numbers';
import { useMemo } from 'react';

import { DepositAmountInputType } from '@/hooks/deposit/depositAmountInputType.js';

interface DepositTokenLike {
    decimals: number;
    price?: number;
}

interface Options {
    value: string;
    inputType: DepositAmountInputType;
    depositToken: DepositTokenLike | null;
    /** When true, amount and USD value are the same (1:1 stablecoin). */
    isSameAsReceiveToken: boolean;
}

export function useDepositAmountConversion({ value, inputType, depositToken, isSameAsReceiveToken }: Options) {
    return useMemo(() => {
        if (!depositToken) {
            return { amount: '0', usdValue: '0' };
        }
        if (isSameAsReceiveToken) {
            return { amount: value, usdValue: value };
        }
        if (inputType === DepositAmountInputType.Amount) {
            return {
                amount: value,
                usdValue: removeTrailingZeros(value ? toFixed(multipliedBy(value, depositToken.price ?? 0), 2) : '0'),
            };
        }
        return {
            amount: removeTrailingZeros(
                value ? toFixed(dividedBy(value, depositToken.price ?? 1), depositToken.decimals) : '0',
            ),
            usdValue: value,
        };
    }, [value, inputType, depositToken, isSameAsReceiveToken]);
}
