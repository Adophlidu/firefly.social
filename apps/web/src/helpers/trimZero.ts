import { isLessThan } from '@dimensiondev/web3/numbers';
import { trimEnd } from 'lodash-es';

/** Trim ending zeros of decimals */
export function trimZero(digit: string) {
    const result = digit.replaceAll(/\.([1-9]*)?0+$/g, (_, p1) => {
        return p1 ? `.${p1}` : '';
    });

    if (isLessThan(result, 1)) {
        return trimEnd(result, '0');
    }

    return result;
}
