import type { TokenCategory } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';

export interface TokenPageProps extends LayoutProps<{
    exchange: string;
    slug: [coingecko_id: string] | [chain_id: string, address: string];
}> {
    searchParams: Promise<TokenPageSearch>;
}

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
