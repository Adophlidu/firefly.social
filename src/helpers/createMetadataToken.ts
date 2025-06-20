import urlcat from 'urlcat';

import { SITE_URL } from '@/constants/index.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isValidAddressEthereum, isValidAddressSolana } from '@/helpers/isValidAddress.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { searchToken } from '@/services/searchToken.js';

export async function createMetadataToken(
    symbol: string,
    options?: {
        chainId?: number;
        address?: string;
        isCoinId?: boolean;
    },
) {
    const { chainId, address, isCoinId } = options || {};
    const paramSymbol = symbol;

    const token = await runInSafeAsync(async () => {
        const isAddress = isValidAddressEthereum(paramSymbol) || isValidAddressSolana(paramSymbol);
        return searchToken({
            token_symbol: isAddress || isCoinId ? undefined : paramSymbol,
            coingecko_id: isCoinId ? paramSymbol : undefined,
            address: isAddress ? paramSymbol : address || undefined,
            chain_id: chainId,
        });
    });

    if (!token) return createSiteMetadata();
    const title = `View ${token.symbol} on Firefly`;
    const description = token.name;
    const ogImage = token.logoURL;

    return createSiteMetadata({
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
