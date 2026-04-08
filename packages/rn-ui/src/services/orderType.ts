import { type FetchOrderTypeSheet, type SubmitOrderTypeChange } from '@/types/services';
import { type OrderTypeSheetData } from '@/types/ui';

const delay = async (ms: number) => {
    await new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

const orderTypeByMarket: Record<string, OrderTypeSheetData> = {
    BTCUSDC: {
        currentType: 'market',
        options: [
            { value: 'market', label: 'Market' },
            { value: 'limit', label: 'Limit' },
        ],
    },
};

const fallbackData: OrderTypeSheetData = {
    currentType: 'market',
    options: [
        { value: 'market', label: 'Market' },
        { value: 'limit', label: 'Limit' },
    ],
};

export const loadOrderTypeSheet: FetchOrderTypeSheet = async ({ market, currentType }) => {
    await delay(320);

    const data = orderTypeByMarket[market] ?? fallbackData;

    return {
        data: {
            ...data,
            currentType,
        },
    };
};

export const submitOrderTypeChange: SubmitOrderTypeChange = async ({ orderType }) => {
    await delay(240);

    return {
        success: true,
        message: orderType === 'market' ? 'Switched to Market' : 'Switched to Limit',
        orderType,
    };
};
