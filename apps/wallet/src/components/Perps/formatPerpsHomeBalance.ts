import BigNumber from 'bignumber.js';

interface FormatPerpsHomeBalanceInput {
    accountOpened: boolean;
    availableBalance?: string;
}

export function formatPerpsHomeBalance({ accountOpened, availableBalance = '0' }: FormatPerpsHomeBalanceInput) {
    if (!accountOpened) return '$0';
    const value = new BigNumber(availableBalance).decimalPlaces(2, BigNumber.ROUND_DOWN);
    const [integer, decimal = ''] = value.toFixed(2).split('.');
    return `$${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${decimal}`;
}
