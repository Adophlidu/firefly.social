import { compact } from 'lodash-es';

import type { BetPortfolioItem, PolymarketProfileData } from '@/providers/types/Firefly.js';
import type { PredictionProfileDataForUI } from '@/types/prediction.js';

export function formatPolymarketProfile(data: PolymarketProfileData): PredictionProfileDataForUI {
    return {
        balance: data.balance,
        cash_balance: data.notfill_balance,
        notfill_balance: data.cash_balance,
        platform_name: data.platform_name,
        platform_avatar: data.platform_avatar,
        pnl: data.pnl,
        proxy: data.proxy,
        wallet: data.wallet || data.proxy,
        tags: compact([data.pnl1m, data.win_rate67, data.join1year, data.pnl100]),
        position_traded: data.position_traded,
        win_rate: data.win_rate,
        losses: data.losses,
        gains: data.gains,
        pnl_rate: data.pnl_rate,
    };
}

export function formatOpinionProfile(data: BetPortfolioItem): PredictionProfileDataForUI {
    return {
        balance: data.balance,
        cash_balance: data.cash_balance,
        notfill_balance: data.notfill_balance,
        platform_name: data.platform_name,
        platform_avatar: data.platform_avatar,
        pnl: data.pnl,
        proxy: data.proxy,
        wallet: data.wallet || data.proxy,
        volume: data.volume,
    };
}
