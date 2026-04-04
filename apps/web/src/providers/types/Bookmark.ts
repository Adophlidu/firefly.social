/** Require coinId or both chainId and address*/
export interface BookmarkTokenOptions {
    /** coingecko coin id */
    coinId?: string | null;
    chainId?: string | number;
    address?: string;
}
