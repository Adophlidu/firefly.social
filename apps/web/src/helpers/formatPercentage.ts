import { isLessThan } from '@dimensiondev/web3/numbers';

/**
 * @param value 0-1
 */
export function formatPercentage(value: number) {
    if (isLessThan(value, '0.0001')) {
        return '< 0.01%';
    }
    const percentage = (value * 100)
        .toFixed(2)
        .replace(/(\.\d*?)0+$/, '$1')
        .replace(/\.$/, '');
    return `${percentage}%`;
}
