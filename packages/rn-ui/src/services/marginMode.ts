import type { FetchMarginModeSheet, SubmitMarginModeChange } from '@/types/services';
import type { MarginModeSheetData } from '@/types/ui';

const delay = async (ms: number) => {
    await new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

const marginModeDataByMarket: Record<string, MarginModeSheetData> = {
    BTCUSDC: {
        currentMode: 'cross',
        options: [
            {
                mode: 'cross',
                title: 'Cross',
                description:
                    'All cross positions share the same cross margin as collateral. In the event of liquidation, your cross margin balance and any remaining open positions under assets in this mode may be forfeited.',
            },
            {
                mode: 'isolated',
                title: 'Isolated',
                description:
                    'Manage your risk on individual positions by restricting the amount of margin allocated to each. lf the margin ratio of an isolated position reaches 100%, the position will be liquidated. Margin can be added or removed to individual positions in this mode.',
            },
        ],
    },
};

const fallbackData: MarginModeSheetData = {
    currentMode: 'cross',
    options: [
        {
            mode: 'cross',
            title: 'Cross',
            description:
                'All cross positions share the same cross margin as collateral. In the event of liquidation, your cross margin balance and any remaining open positions under assets in this mode may be forfeited.',
        },
        {
            mode: 'isolated',
            title: 'Isolated',
            description:
                'Manage your risk on individual positions by restricting the amount of margin allocated to each. lf the margin ratio of an isolated position reaches 100%, the position will be liquidated. Margin can be added or removed to individual positions in this mode.',
        },
    ],
};

export const loadMarginModeSheet: FetchMarginModeSheet = async ({ market, currentMode }) => {
    await delay(420);

    const data = marginModeDataByMarket[market] ?? fallbackData;

    return {
        data: {
            ...data,
            currentMode,
        },
    };
};

export const submitMarginModeChange: SubmitMarginModeChange = async ({ mode }) => {
    await delay(360);

    return {
        success: true,
        message: mode === 'cross' ? 'Switched to Cross' : 'Switched to Isolated',
        mode,
    };
};
