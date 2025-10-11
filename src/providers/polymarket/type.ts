export type PolymarketResponse<T extends object> =
    | T
    | {
          error: string;
      };

export type TradedMarketsResponse = PolymarketResponse<{
    traded: number;
    user: string;
}>;

export type VolumeTradedResponse = PolymarketResponse<
    Array<{
        amount: number;
        bio: string;
        name: string;
        profileImage: string;
        profileImageOptimized: string;
        proxyWallet: string;
        pseudonym: string;
    }>
>;
