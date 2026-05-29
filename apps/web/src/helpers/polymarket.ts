import { runInSafe } from '@dimensiondev/utils';

import { nFormatter } from '@/helpers/formatCommentCounts.js';
import type { BetsActivity } from '@/providers/types/Firefly.js';

const tailZero = /\.0+$|(\.\d*[1-9])0+$/;

export function toFixedTrimmed(num: number, fixed: number) {
    if (Number.isNaN(num)) return '0';

    const fixedNum = num.toFixed(fixed);

    const decimalIndex = fixedNum.indexOf('.');
    if (decimalIndex === -1) {
        if (fixed > 0) {
            return fixedNum + '.' + '0'.repeat(fixed);
        }
        return fixedNum;
    }

    const currentDecimals = fixedNum.length - decimalIndex - 1;
    if (currentDecimals < fixed) {
        return fixedNum + '0'.repeat(fixed - currentDecimals);
    }

    return fixedNum.replace(tailZero, '$1');
}

export function computeVolume(activity: BetsActivity, index: number) {
    const ratio = runInSafe(
        () => {
            const total = activity.conditionOutcomePrices.reduce((acc, price) => acc + Number.parseFloat(price), 0);
            return Math.min(parseFloat(activity.conditionOutcomePrices[index]) / total, 1);
        },
        {
            defaultValue: 0.5,
        },
    ) as number;

    return nFormatter(parseFloat(activity.volume) * ratio, 2);
}
