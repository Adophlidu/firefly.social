import { type FetchAccountAmountSheet, type SubmitAccountAmountAction } from '@/types/services';
import { type AccountAmountSheetData } from '@/types/ui';

const delay = async (ms: number) => {
    await new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

const accountAmountByMarket: Record<string, AccountAmountSheetData> = {
    BTCUSDC: {
        title: 'Portfolio',
        totalBalanceWhole: '2,900',
        totalBalanceFraction: '.45',
        availableLabel: 'Available: $742.86',
        actions: [
            { type: 'withdraw', label: 'Withdraw' },
            { type: 'addFunds', label: 'Add Funds' },
        ],
    },
};

const fallbackData: AccountAmountSheetData = {
    title: 'Portfolio',
    totalBalanceWhole: '2,900',
    totalBalanceFraction: '.45',
    availableLabel: 'Available: $742.86',
    actions: [
        { type: 'withdraw', label: 'Withdraw' },
        { type: 'addFunds', label: 'Add Funds' },
    ],
};

export const loadAccountAmountSheet: FetchAccountAmountSheet = async ({ market, available }) => {
    await delay(320);

    const data = accountAmountByMarket[market] ?? fallbackData;

    return {
        data: {
            ...data,
            availableLabel: `Available: ${available}`,
        },
    };
};

export const submitAccountAmountAction: SubmitAccountAmountAction = async ({ action }) => {
    await delay(240);

    return {
        success: true,
        message: action === 'withdraw' ? 'Withdraw started' : 'Add Funds started',
        action,
    };
};
