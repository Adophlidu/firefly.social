export type PrivyResponse<T> =
    | T
    | {
          error: string;
          code?: string;
      };

export interface CoinbaseBuyerToken {
    app_id: string;
    partner_user_id: string;
    session_token: string;
}

export type CoinbaseAsset = 'USDC' | 'ETH' | 'BTC' | 'SOL' | 'POL' | 'MON';
export type CoinbaseNetwork = 'ethereum' | 'solana';
