import type { FetchLeverageSheet, SubmitLeverageChange } from '@/types/services';
import type { LeverageSheetData } from '@/types/ui';

const delay = async (ms: number) => {
    await new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

const leverageDataByMarket: Record<string, LeverageSheetData> = {
    BTCUSDC: {
        symbol: 'BTC',
        currentLeverage: 10,
        minLeverage: 1,
        maxLeverage: 40,
        step: 1,
        notes: [
            'Control the leverage used for BTC positions. The maximum leverage is 40x.',
            'Maximum position at current leverage: 150,000,000 USDC.',
            'Max position size decreases the higher your leverage.',
        ],
    },
};

const fallbackData: LeverageSheetData = {
    symbol: 'BTC',
    currentLeverage: 10,
    minLeverage: 1,
    maxLeverage: 40,
    step: 1,
    notes: [
        'Control the leverage used for BTC positions. The maximum leverage is 40x.',
        'Maximum position at current leverage: 150,000,000 USDC.',
        'Max position size decreases the higher your leverage.',
    ],
};

export const loadLeverageSheet: FetchLeverageSheet = async ({ market, currentLeverage }) => {
    await delay(440);

    const data = leverageDataByMarket[market] ?? fallbackData;

    return {
        data: {
            ...data,
            currentLeverage: currentLeverage || data.currentLeverage,
        },
    };
};

export const submitLeverageChange: SubmitLeverageChange = async ({ leverage }) => {
    await delay(360);

    return {
        success: true,
        message: `Leverage updated to ${leverage}x`,
        leverage,
    };
};
