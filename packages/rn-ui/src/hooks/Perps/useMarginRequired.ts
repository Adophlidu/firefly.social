import { useAtomValue } from 'jotai';

import { getMarginRequired } from '@/helpers/calculateLiquidationPrice';
import { isValidSize } from '@/helpers/isValidSize';
import { currentPriceAtom, leverageAtom, sizeAtom } from '@/store/tradeForm';

export function useMarginRequired() {
    const size = useAtomValue(sizeAtom);
    const currentPrice = useAtomValue(currentPriceAtom);
    const leverage = useAtomValue(leverageAtom);

    if (!isValidSize(size) || !isValidSize(currentPrice)) return '0';

    return getMarginRequired({ size, price: currentPrice, leverage }).toFormat(2);
}
