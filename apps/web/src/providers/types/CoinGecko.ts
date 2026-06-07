import type { CurrencyType } from '@dimensiondev/enums';
import type { Address } from 'viem';

import type { Runtime } from '@/providers/types/Trending.js';

export type { CoinGeckoCoinMarketInfo, CoinGeckoToken } from '@dimensiondev/workers-token';

export interface CoinGeckoCoinInfo {
    asset_platform_id: string;
    block_time_in_minutes: number;
    categories: string[];
    contract_address: string;
    description: Record<string, string>;
    developer_score: number;
    id: string;
    image: {
        large: string;
        small: string;
        thumb: string;
    };
    last_updated: string;
    links: {
        announcement_url: string[];
        bitcointalk_thread_identifier: null;
        blockchain_site: string[];
        chat_url: string[];
        facebook_username: string;
        homepage: string[];
        official_forum_url: string[];
        repos_url: { github: string[]; bitbucket: string[] };
        subreddit_url: string;
        telegram_channel_identifier: string;
        twitter_screen_name: string;
    };
    liquidity_score: string;
    market_cap_rank: number | null;
    market_cap_rank_with_rehypothecated?: number | null;
    market_data: {
        current_price: Record<string, number>;
        high_24h: Record<string, number>;
        low_24h: Record<string, number>;
        market_cap: Record<string, number>;
        market_cap_rank: number | null;
        market_cap_rank_with_rehypothecated?: number | null;
        price_change_percentage_1h_in_currency: number;
        price_change_percentage_1y_in_currency: number;
        price_change_percentage_7d_in_currency: number;
        price_change_percentage_14d_in_currency: number;
        price_change_percentage_24h_in_currency: number;
        atl_change_percentage?: number;
        price_change_percentage_30d_in_currency: number;
        price_change_percentage_60d_in_currency: number;
        price_change_percentage_200d_in_currency: number;

        total_supply: number;
        total_volume: Record<string, number>;
    };
    platforms: Record<Runtime, string>;
    name: string;
    symbol: string;
    tickers: Array<{
        base: string;
        target: string;
        market: {
            name: 'string';
            identifier: string;
            has_trading_incentive: boolean;
            logo: string;
        };
        last: number;
        volume: number;
        converted_last: {
            btc: number;
            eth: number;
            usd: number;
        };
        converted_volume: {
            btc: number;
            eth: number;
            usd: number;
        };
        trust_score: 'green';
        bid_ask_spread_percentage: number;
        timestamp: string;
        last_traded_at: string;
        last_fetch_at: string;
        is_anomaly: boolean;
        is_stale: boolean;
        trade_url: string;
        coin_id: string;
        target_coin_id?: string;
    }>;
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

export interface CoinGeckoAsset {
    id: string;
    type: string;
    /** patch at runtime */
    chain_id: number;
    attributes: {
        address: string;
        name: string;
        symbol: string;
        decimals: number;
        image_url: string;
        coingecko_coin_id?: string;
        total_supply: string;
        normalized_total_supply: string;
        price_usd: string;
        fdv_usd: string;
        total_reserve_in_usd: string;
        volume_usd: { h24: string };
        market_cap_usd: string;
        /** patch at runtime */
        chain_id?: number;
    };
    relationships: {
        top_pools: {
            data: Array<{
                id: string;
                type: `${string}_${Address}`;
            }>;
        };
    };
}

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
