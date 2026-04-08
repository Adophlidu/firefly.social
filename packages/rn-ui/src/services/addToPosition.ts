import { type FetchAddToPositionSheet, type SubmitAddToPosition } from '@/types/services';
import { type AddToPositionSheetData } from '@/types/ui';

const delay = async (ms: number) => {
    await new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

const addToPositionByMarket: Record<string, Record<string, AddToPositionSheetData>> = {
    BTCUSDC: {
        'pos-1': {
            symbol: 'BTC',
            currentPrice: '$70,401',
            defaultAmount: '10.19',
            minimumAmount: 5.05,
            liquidationPrice: '$92,356',
            newTotal: '$110.21',
        },
        'pos-2': {
            symbol: 'BTC',
            currentPrice: '$70,401',
            defaultAmount: '8.50',
            minimumAmount: 5.05,
            liquidationPrice: '$89,120',
            newTotal: '$98.52',
        },
    },
};

const fallbackData: AddToPositionSheetData = {
    symbol: 'BTC',
    currentPrice: '$70,401',
    defaultAmount: '10.19',
    minimumAmount: 5.05,
    liquidationPrice: '$92,356',
    newTotal: '$110.21',
};

export const loadAddToPositionSheet: FetchAddToPositionSheet = async ({ market, positionId }) => {
    await delay(550);

    const marketData = addToPositionByMarket[market] ?? addToPositionByMarket.BTCUSDC;
    const data = marketData?.[positionId] ?? fallbackData;

    return {
        data,
    };
};

export const submitAddToPosition: SubmitAddToPosition = async ({ amount }) => {
    await delay(450);

    if (amount <= 0) {
        return {
            success: false,
            message: 'Invalid amount',
        };
    }

    return {
        success: true,
        message: 'Position updated',
    };
};
