import { useLingui } from '@lingui/react/macro';
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
    const { i18n } = useLingui();
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
                label: i18n._('rn-ui.submitButton.insufficientBalance'),
                disabled: true,
            };
        }
        if (isValidSize(marginRequired) && isLessThan(balance, marginRequired)) {
            return {
                label: i18n._('rn-ui.submitButton.insufficientMargin'),
                disabled: true,
            };
        }

        return { disabled: false };
    }, [i18n, size, currentPrice, balance, marginRequired]);
}
