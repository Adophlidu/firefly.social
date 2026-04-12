import type { QueryClient } from '@tanstack/react-query';
import type { Address } from 'viem';

import { queryClient } from '@/configs/queryClient.js';
import type { SearchTokenResponse } from '@/providers/types/Firefly.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export function getSearchTokensQuery(query: string) {
    return {
        queryKey: ['search-tokens', query],
        async queryFn() {
            return getFireflyEndpoint().searchTokens(query);
        },
        enabled: !!query,
    };
}

export function extractLogoURI(data: SearchTokenResponse['data'] | null): string | null {
    if (!data?.coins?.length) {
        return null;
    }
    return data.coins.find((coin) => coin.largeLogo)?.largeLogo ?? null;
}

export async function searchTokenLogoURI({
    address,
    name,
    symbol,
    client = queryClient,
}: {
    address?: Address;
    name?: string;
    symbol?: string;
    client?: QueryClient;
}): Promise<string | null> {
    for (const query of [address, symbol, name]) {
        if (!query) continue;

        try {
            const result = await client.ensureQueryData(getSearchTokensQuery(query));
            const logoURI = extractLogoURI(result);
            if (logoURI) return logoURI;
        } catch {
            continue;
        }
    }

    return null;
}
