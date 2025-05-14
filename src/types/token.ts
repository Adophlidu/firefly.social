export interface PriceRecord {
    date: number;
    value: number;
}
export interface TradeRecord {
    value: number | undefined;
    date: number;
    user: {
        name?: string;
        avatar: string;
    };
    amount: string;
    uiAmount: string;
    decimals: number;
    type: 'buy' | 'sell';
}
