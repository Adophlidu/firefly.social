/* cspell:disable */
/**
 * Collect from https://docs.cloud.debank.com/en/readme/api-pro-reference/chain#returns-1
 * To get the full list: `curl https://debank-proxy.r2d2.to/v1/chain/list | jq ".[].id"`
 */
export type DebankChains =
    | 'arb'
    | 'astar'
    | 'aurora'
    | 'avax'
    | 'base'
    | 'boba'
    | 'sei'
    | 'brise'
    | 'bsc'
    | 'btt'
    | 'canto'
    | 'celo'
    | 'cfx'
    | 'cro'
    | 'dfk'
    | 'doge'
    | 'eth'
    | 'evmos'
    | 'ftm'
    | 'fuse'
    | 'heco'
    | 'hmy'
    | 'iotx'
    | 'kava'
    | 'kcc'
    | 'klay'
    | 'mada'
    | 'matic'
    | 'metis'
    | 'mobm'
    | 'movr'
    | 'nova'
    | 'okt'
    | 'op'
    | 'palm'
    | 'pls'
    | 'rsk'
    | 'sbch'
    | 'scrl'
    | 'sdn'
    | 'sgb'
    | 'step'
    | 'swm'
    | 'tlos'
    | 'wan'
    | 'xdai'
    | 'xlayer';

export interface Token<AddressLike = string> {
    amount: number;
    chain: string;
    decimals: number;
    display_symbol: string | null;
    id: AddressLike;
    is_core: boolean;
    is_verified: boolean;
    is_wallet: boolean;
    logo_url: string;
    name: string;
    optimized_symbol: string;
    price: string | number;
    price_24h_change: number;
    protocol_id: string;
    raw_amount: string;
    raw_amount_hex_str: string;
    symbol: string;
    time_at: number;
}

export interface UserTotalBalanceResponse {
    total_usd_value: number;
    chain_list: Array<{
        id: DebankChains;
        /** equals to ChainId */
        community_id: number;
        name: string;
        logo_url: string;
        native_token_id: string;
        /** address */
        wrapped_token_id: string;
        usd_value: number;
    }>;
}
