/* cspell:disable */

import type {
    AccountHistoryPageResponse,
    FetchAccountHistory,
    FetchTradingHistory,
    TradingHistoryPageResponse,
} from '@/types/services';
import { type AccountHistoryItem, type TradingHistoryItem } from '@/types/ui';

const delay = async (ms: number) => {
    await new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

const symbols = ['BTCUSDC', 'ETHUSDC', 'SOLUSDC', 'DOGEUSDC', 'AVAXUSDC', 'LINKUSDC'];
const actions = ['Open Long', 'Open Short', 'Close Long', 'Close Short'];

const defaultTradingHistory: TradingHistoryItem[] = Array.from({ length: 72 }, (_, index) => {
    const id = index + 1;
    const symbol = symbols[index % symbols.length];
    const action = actions[index % actions.length];
    const basePrice = 64000 + (index % 12) * 375;
    const size = 0.0001 + (index % 9) * 0.00005;
    const value = 250 + (index % 10) * 37.5;
    const month = 3;
    const day = (index % 28) + 1;
    const hour = (index * 3) % 24;
    const minute = (index * 7) % 60;
    const second = (index * 11) % 60;

    const withPnl = id % 2 === 0;
    const pnlValue = ((index % 13) + 1) * 1.17;
    const pnl = id % 4 === 0 ? `-$${pnlValue.toFixed(2)}` : `+$${pnlValue.toFixed(2)}`;

    return {
        id: `t-${id}`,
        symbol,
        action,
        price: `$${basePrice.toLocaleString('en-US')}`,
        positionSize: size.toFixed(5),
        tradeValue: `$${value.toFixed(2)}`,
        timestamp: `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/2026, ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`,
        pnl: withPnl ? pnl : undefined,
    };
});

const defaultAccountHistory: AccountHistoryItem[] = Array.from({ length: 64 }, (_, index) => {
    const id = index + 1;
    const isAddFunds = id % 2 === 1;
    const amount = (8.5 + (index % 15) * 4.73).toFixed(2);
    const timeValue = (index % 59) + 1;
    const timeUnit = index % 3 === 0 ? 'minute' : index % 3 === 1 ? 'hour' : 'day';
    const plural = timeValue > 1 ? 's' : '';

    return {
        id: `a-${id}`,
        type: isAddFunds ? 'addFunds' : 'withdraw',
        title: isAddFunds ? 'Add Funds' : 'Withdraw',
        timeAgo: `${timeValue} ${timeUnit}${plural} ago`,
        amount: `${isAddFunds ? '+' : '-'}$${amount}`,
    };
});

export const loadTradingHistoryPage: FetchTradingHistory = async ({
    page,
    pageSize,
}): Promise<TradingHistoryPageResponse> => {
    await delay(600);

    const start = (page - 1) * pageSize;
    const end = page * pageSize;

    return {
        items: defaultTradingHistory.slice(start, end),
        hasMore: end < defaultTradingHistory.length,
    };
};

export const loadAccountHistoryPage: FetchAccountHistory = async ({
    page,
    pageSize,
}): Promise<AccountHistoryPageResponse> => {
    await delay(600);

    const start = (page - 1) * pageSize;
    const end = page * pageSize;

    return {
        items: defaultAccountHistory.slice(start, end),
        hasMore: end < defaultAccountHistory.length,
    };
};
