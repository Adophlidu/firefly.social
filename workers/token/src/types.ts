import type { TokenPlatformType } from '@dimensiondev/enums';
import type { FireflyResponse } from '@dimensiondev/workers-shared/types/firefly.js';
import type { Address } from 'viem';

export interface CoinGeckoToken {
    id: string | null;
    chainId?: number;
    address?: string;
    symbol: string;
    name: string;
    price?: number;
    changePercent24h?: number;
    type: 'FungibleToken';
    logoURL: string;
    rank?: number | null;
    socialLinks?: {
        /** url */
        website: string;
        twitter: string;
        telegram?: string;
    };
    /**
     * @see TokenWithMarketData['platform_info']
     * Only provided by Firefly's API
     */
    platform_info?: Array<{
        chain_name: string;
        token_address: string;
        decimals: number;
        swap: number;
        chain_id: number;
    }>;
}

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
        coingecko_coin_id: string;
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
                type: `${string}_0x${string}`;
            }>;
        };
    };
}

export interface CoinGeckoCoinMarketInfo {
    ath: number;
    ath_change_percentage: number;
    ath_date: string;
    atl: number;
    atl_change_percentage: number;
    atl_date: string;
    circulating_supply: number;
    current_price: number;
    fully_diluted_valuation: number;
    high_24h: number;
    id: string;
    image: string;
    last_updated: string;
    low_24h: number;
    market_cap: number;
    market_cap_change_24h: number;
    market_cap_change_percentage_24h: number;
    market_cap_rank: number | null;
    market_cap_rank_with_rehypothecated?: number | null;
    max_supply: number;
    name: string;
    price_change_24h: number;
    price_change_percentage_24h: number;
    roi: unknown;
    symbol: string;
    total_supply: number;
    total_volume: number;
}

export interface GetTokenOptions {
    coingecko_id?: string | null;
    network?: string;
    chain_id?: number;
    address?: string;
    token_symbol?: string;
    localization?: boolean | 'usd' | string;
    tickers?: boolean | 1;
    market_data?: boolean;
    community_data?: boolean;
    developer_data?: boolean;
    sparkline?: boolean;
}

export interface TokenWithMarketData {
    detail_platforms: unknown;
    id: string;
    image: Record<'small' | 'thumb' | 'large', string>;
    links: {
        homepage: string[];
        twitter_handle: string;
    };
    market_data?: {
        fully_diluted_valuation: number;
        high_24h_usd: number;
        low_24h_usd: number;
        market_cap_usd: number;
        price_change_percentage_24h: number | null;
        token_price_usd: number;
        volume_usd_24h: number;
    };
    name: string;
    platforms: unknown;
    support_swap_platform: Array<{
        chainIndex: string;
        decimals: string;
        tokenContractAddress: string;
        tokenLogoUrl: string;
        tokenName: string;
        tokenSymbol: string;
    }>;
    platform_info: Array<{
        chain_name: string;
        token_address: string;
        decimals: number;
        swap: number;
        chain_id: number;
    }>;
    symbol: string;
    web_slug: string;
    contract_address: string;
}

/** Results from /v2/token/search */
export interface SearchTokenInfo extends Omit<TokenWithMarketData, 'id'> {
    id: string | null;
    platform_type: TokenPlatformType;
    /** coingecko chian id */
    chain: string;
    chain_id: number;
    contract_address: string;
    web_slug: string;
    platforms: {
        [platform: string]: Address;
    };
    platform_info: Array<{
        chain_name: string;
        token_address: Address;
        decimals: number;
        swap: number;
        chain_id: number;
    }>;
}

// extract from https://coingecko-agent.r2d2.to/api/v3/coins/usd-coin
export type Runtime =
    | 'ethereum'
    | 'algorand'
    | 'arbitrum-one'
    | 'binance-smart-chain'
    | 'avalanche'
    | 'base'
    | 'celo'
    | 'energi'
    | 'flow'
    | 'hedera-hashgraph'
    | 'kava'
    | 'near-protocol'
    | 'optimistic-ethereum'
    | 'polkadot'
    | 'polygon-pos'
    | 'solana'
    | 'stellar'
    | 'the-open-network'
    | 'tron'
    | 'zksync';

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

export interface SearchableToken {
    /** only search by keyword has platform_type */
    platform_type?: TokenPlatformType;
    api_symbol: string;
    id: string;
    chainId?: number;
    address?: string;
    largeLogo: string;
    market_cap_rank?: number | null;
    name: string;
    symbol: string;
    thumbnail: string;
    fdv?: number;
}

export type TokenWithMarket = SearchableToken & { market?: Partial<CoinGeckoCoinMarketInfo> };

export interface DetectedAddress {
    type: 'eth' | 'solana';
    chain: string;
    chain_id: string;
    address_type: 'eoa' | 'soa' | 'contract';
    contract_type: 'ERC20' | 'ERC721' | 'ERC1155' | 'token' | 'nft' | 'program' | 'unknown';
    /** To detect collection, use v1/nft/detect API instead */
    contract_info?: CoinGeckoAsset;
}

export type CoinGeckoCoinInfoResponse = FireflyResponse<CoinGeckoCoinInfo>;
export type CoinGeckoCoinMarketInfosResponse = CoinGeckoCoinMarketInfo[];
export type CoinGeckoTokenInfosResponse = CoinGeckoToken[];
export type TokenWithMarketDataResponse = FireflyResponse<TokenWithMarketData>;
export type SearchTokenInfosResponse = FireflyResponse<SearchTokenInfo[]>;
export type DetectAddressResponse = FireflyResponse<{
    list: DetectedAddress[];
}>;
