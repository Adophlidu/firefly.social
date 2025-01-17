import type { Address } from 'viem';

import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

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
        const logoURI = await FireflyEndpointProvider.searchTokens(query)
            .then((x) => x.data[0]?.thumb)
            .catch(() => null);
        if (logoURI) return logoURI;
    }
    return null;
}
