import BigNumber from 'bignumber.js';

export function formatPerpsAccountBalance(value?: string) {
    const amount = new BigNumber(value ?? '');
    if (!amount.isFinite()) return '$--';
    return `$${amount.decimalPlaces(2, BigNumber.ROUND_DOWN).toFormat(2)}`;
}
