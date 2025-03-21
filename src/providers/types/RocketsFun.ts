export interface RocketsFunResponse<T> {
    code: number;
    data: T;
}

export interface PaginationResponse<T> extends RocketsFunResponse<T[]> {
    pagination: {
        total: number;
        totalPages: number;
        currentPage: number;
        pageSize: number;
    };
}

export interface RocketsFunToken {
    id: string;
    name: string;
    symbol: string;
    deployer: string;
    userId: string;
    imageUrl: string;
    messageId: string;
    platform: 'Telegram' | 'X';
    contractAddress: string;
    chain: 'bnb';
    pair: string;
    poolAddress: string;
    twitter_url: string | null;
    created_at: string;
    updated_at: string;
    token_info: unknown;
    price: number;
    market_cap: number;
    volume_usd: number;
    tvl_usd: number;
    fees_usd: number;
    fee_tier: number;
    total_supply: number;
}
