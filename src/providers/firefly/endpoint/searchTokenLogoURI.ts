import type { Address } from 'viem';

import { searchTokens } from '@/providers/firefly/endpoint/searchTokens.js';

export async function searchTokenLogoURI({
    address,
    name,
    symbol,
}: {
    address?: Address;
    name?: string;
    symbol?: string;
}): Promise<string | null> {
    for (const query of [address, symbol, name]) {
        if (!query) continue;
        const logoURI = await searchTokens(query)
            .then((x) => x.data[0]?.largeLogo)
            .catch(() => null);
        if (logoURI) return logoURI;
    }
    return null;
}
