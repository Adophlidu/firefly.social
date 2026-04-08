import { type FetchTpSlSheet, type SubmitTpSl } from '@/types/services';
import { type TpSlSheetData } from '@/types/ui';

const delay = async (ms: number) => {
    await new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

const tpSlDataByMarket: Record<string, Record<string, TpSlSheetData>> = {
    BTCUSDC: {
        'pos-1': {
            symbol: 'BTCUSDC',
            entryPrice: '68,523',
            markPrice: '72,101',
            estimatedLiqPrice: '32,538',
            tpPrice: '',
            tpOperator: '+',
            tpType: 'percent',
            slPrice: '',
            slOperator: '-',
            slType: 'percent',
        },
        'pos-2': {
            symbol: 'BTCUSDC',
            entryPrice: '68,523',
            markPrice: '72,101',
            estimatedLiqPrice: '32,538',
            tpPrice: '',
            tpOperator: '+',
            tpType: 'percent',
            slPrice: '',
            slOperator: '-',
            slType: 'percent',
        },
    },
};

const fallbackData: TpSlSheetData = {
    symbol: 'BTCUSDC',
    entryPrice: '68,523',
    markPrice: '72,101',
    estimatedLiqPrice: '32,538',
    tpPrice: '',
    tpOperator: '+',
    tpType: 'percent',
    slPrice: '',
    slOperator: '-',
    slType: 'percent',
};

export const loadTpSlSheet: FetchTpSlSheet = async ({ market, positionId }) => {
    await delay(520);

    const marketData = tpSlDataByMarket[market] ?? tpSlDataByMarket.BTCUSDC;
    const data = marketData?.[positionId] ?? fallbackData;

    return { data };
};

export const submitTpSl: SubmitTpSl = async ({ tpPrice, slPrice }) => {
    await delay(380);

    return {
        success: true,
        message: tpPrice || slPrice ? 'TP/SL updated' : 'TP/SL confirmed',
    };
};
