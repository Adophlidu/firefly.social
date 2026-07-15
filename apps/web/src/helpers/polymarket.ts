import { removeTrailingZeros, runInSafe } from '@dimensiondev/utils';

import { nFormatter } from '@/helpers/formatCommentCounts.js';
import type { BetsActivity } from '@/providers/types/Firefly.js';

const tailZero = /\.0+$|(\.\d*[1-9])0+$/;

/**
 * Format a token's order-book ask (0..1) as the label shown on a Polymarket Buy button.
 * An ask of 1 (100¢) or 0 means there is no real ask liquidity — show "--" like the
 * official site. Only 0 < ask < 1 is a genuine ask (e.g. 0.99 → "99¢").
 */
export function formatBuyButtonAsk(ask: number): string {
    if (!(ask > 0 && ask < 1)) return '--';
    return `${removeTrailingZeros((ask * 100).toFixed(1))}¢`;
}

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
