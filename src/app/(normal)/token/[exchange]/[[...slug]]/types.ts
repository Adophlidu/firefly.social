import { type TokenCategory } from '@/constants/enum.js';
import { type NextPageProps } from '@/types/utility.js';

export interface TokenPageProps
    extends NextPageProps<
        {
            exchange: string;
            slug: [coingecko_id: string] | [chain_id: string, address: string];
        },
        TokenPageSearch
    > {}

export interface TokenPageSearch {
    wallet: string;
    chainId?: string;
    /** if is coingecko coin id, which is more specific */
    isCoinId?: 'true';
    /** trader wallet address */
    trader?: string;
    /** to keep consistent with previous entry */
    traderName?: string;
    address?: string;
    source?: string;
    category?: TokenCategory;
}
