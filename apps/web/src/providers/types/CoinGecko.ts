import type { CurrencyType } from '@dimensiondev/enums';
import type { CoinGeckoCoinInfo as WorkerCoinGeckoCoinInfo } from '@dimensiondev/workers-token';

export type { CoinGeckoAsset, CoinGeckoToken } from '@dimensiondev/workers-token';

export interface CoinGeckoCoinInfo extends WorkerCoinGeckoCoinInfo {
    // Present on some CoinGecko responses but not modeled by the worker yet.
    market_cap_rank_with_rehypothecated?: number | null;
}

export interface CoinGeckoPlatform {
    id?: string;
    chain_identifier?: number;
    name: string;
    shortname: string;
    native_coin_id: string;
    image: {
        thumb: string;
        small: string;
    };
}

export type Price = Partial<Record<CurrencyType, string>>;

export interface TreasuryHoldingItem {
    name: string;
    symbol: string;
    country: string;
    total_holdings: number;
    total_entry_value_usd: number;
    total_current_value_usd: number;
    percentage_of_total_supply: number;
}

export interface TreasuryHoldings {
    total_holdings: number;
    total_value_usd: number;
    market_cap_dominance: number;
    companies?: TreasuryHoldingItem[];
    governments?: TreasuryHoldingItem[];
}
