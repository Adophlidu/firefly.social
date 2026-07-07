import type { Runtime } from '@dimensiondev/workers-token';

type CommunityType =
    | 'discord'
    | 'facebook'
    | 'instagram'
    | 'medium'
    | 'reddit'
    | 'telegram'
    | 'linkedin'
    | 'github'
    | 'youtube'
    | 'twitter'
    | 'other';

export interface ClubUrl {
    type: CommunityType;
    link: string;
}

interface Coin {
    id: string;
    chainId?: number;
    name: string;
    symbol: string;
    type: 'Fungible';
    decimals?: number;
    platform_url?: string;
    tags?: string[];
    tech_docs_urls?: string[];
    message_board_urls?: string[];
    source_code_urls?: string[];
    community_urls?: ClubUrl[];
    home_urls?: string[];
    announcement_urls?: string[];
    blockchain_urls?: string[];
    image_url?: string;
    description?: string;
    market_cap_rank?: number;
    address?: string;
    contract_address?: string;
    facebook_url?: string;
    twitter_url?: string;
    telegram_url?: string;
}

interface Platform {
    id: string | number;
    name: string;
    slug: string;
    symbol: string;
}

// CoinGecko asset-platform runtimes; canonical list lives in the token worker
export type { Runtime };

export interface Contract {
    runtime: Runtime;
    /** patched at runtime */
    chainId?: number;
    chainName: string;
    address: string;
    icon_url?: string;
}

interface Market {
    current_price: string | undefined;
    circulating_supply?: number;
    fully_diluted_valuation?: number;
    market_cap_fdv_ratio?: number;
    market_cap?: number;
    max_supply?: number;
    total_supply?: number;
    total_volume?: number;
    price_symbol?: string;
    price_token_address?: string;
    price_change_percentage_1h?: number;
    price_change_24h?: number;
    price_change_percentage_24h?: number;
    price_change_percentage_1h_in_currency?: number;
    price_change_percentage_1y_in_currency?: number;
    price_change_percentage_7d_in_currency?: number;
    price_change_percentage_14d_in_currency?: number;
    price_change_percentage_24h_in_currency?: number;
    price_change_percentage_30d_in_currency?: number;
    price_change_percentage_60d_in_currency?: number;
    price_change_percentage_200d_in_currency?: number;
    atl_change_percentage?: number;
}

export enum TrendingProvider {
    CoinGecko = 'coingecko',
}

export interface Trending {
    provider: TrendingProvider;
    coin: Coin;
    platform?: Platform;
    contracts?: Contract[];
    market?: Market;
    lastUpdated: string;
}
