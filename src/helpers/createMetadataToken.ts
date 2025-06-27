import urlcat from 'urlcat';

import { SITE_URL } from '@/constants/index.js';
import { createPageTitleOG } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isValidAddressEthereum, isValidAddressSolana } from '@/helpers/isValidAddress.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { searchToken } from '@/services/searchToken.js';

export async function createMetadataToken(
    pathname: string,
    symbol: string,
    options?: {
        chainId?: number;
        address?: string;
        isCoinId?: boolean;
    },
) {
    const { chainId, address, isCoinId } = options || {};

    const token = await runInSafeAsync(async () => {
        const isAddress = isValidAddressEthereum(symbol) || isValidAddressSolana(symbol);
        return searchToken({
            token_symbol: isAddress || isCoinId ? undefined : symbol,
            coingecko_id: isCoinId ? symbol : undefined,
            address: isAddress ? symbol : address || undefined,
            chain_id: chainId,
        });
    });
    if (!token) return createSiteMetadata(pathname);

    if (!token) return createSiteMetadata();
    const title = createPageTitleOG(`$${token.symbol.toUpperCase()}`);
    const description = token.name;
    const ogImage = token.logoURL;

    return createSiteMetadata(pathname, {
        title,
        description,
        openGraph: {
            type: 'profile',
            url: urlcat(SITE_URL, '/'),
            title,
            description,
            images: [ogImage],
        },
        twitter: {
            card: 'summary',
            title,
            description,
            images: [ogImage],
        },
    });
}
