import { isLessThan, isNumber, isZero } from '@/helpers/number';

export function isValidSize(size: string) {
    if (!size || !isNumber(size) || isLessThan(size, 0) || isZero(size)) {
        return false;
    }

    return true;
}
