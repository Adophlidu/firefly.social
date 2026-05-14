import type { UserFillsResponse } from '@nktkas/hyperliquid';

export type KlineInterval = '1m' | '15m' | '1h' | '4h' | 'D';

export interface CandleDatum {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface FillMarker {
    time: number;
    side: 'B' | 'A';
    price: number;
    size: number;
}

export type UserFill = UserFillsResponse[number];
