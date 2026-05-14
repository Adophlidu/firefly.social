import { useAtomValue } from 'jotai';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { isValidSize } from '@/helpers/isValidSize';
import { isLessThan } from '@/helpers/number';
import { useMarginRequired } from '@/hooks/Perps/useMarginRequired';
import { assetBalanceAtom, currentPriceAtom, sizeAtom } from '@/store/tradeForm';

export function useSubmitButtonLabel(): {
    label?: ReactNode;
    disabled: boolean;
} {
    const size = useAtomValue(sizeAtom);
    const currentPrice = useAtomValue(currentPriceAtom);
    const balance = useAtomValue(assetBalanceAtom);
    const marginRequired = useMarginRequired();

    return useMemo(() => {
        if (!isValidSize(size) || !isValidSize(currentPrice)) {
            return {
                disabled: true,
            };
        }
        if (!isValidSize(balance)) {
            return {
                label: 'Insufficient balance',
                disabled: true,
            };
        }
        if (isValidSize(marginRequired) && isLessThan(balance, marginRequired)) {
            return {
                label: 'Insufficient margin',
                disabled: true,
            };
        }

        return { disabled: false };
    }, [size, currentPrice, balance, marginRequired]);
}
