import { createBatcher } from '@dimensiondev/utils';

import { getTokenPrices } from '@/providers/coingecko/getTokenPrices.js';

interface TokenPricePayload {
    platform_id: string;
    address: string;
}

function makeKey(platform_id: string, address: string) {
    return `${platform_id}:${address.toLowerCase()}`;
}

async function fetcher(payloads: TokenPricePayload[]): Promise<Record<string, number>> {
    if (payloads.length === 0) return {};

    // The endpoint accepts a single platform per request, so group addresses by platform.
    const addressesByPlatform = new Map<string, string[]>();
    for (const { platform_id, address } of payloads) {
        const addresses = addressesByPlatform.get(platform_id);
        if (addresses) addresses.push(address);
        else addressesByPlatform.set(platform_id, [address]);
    }

    const records = await Promise.all(
        Array.from(addressesByPlatform, async ([platform_id, addresses]) => {
            const prices = await getTokenPrices(platform_id, addresses);
            return [platform_id, prices] as const;
        }),
    );

    const result: Record<string, number> = {};
    for (const [platform_id, prices] of records) {
        for (const [address, price] of Object.entries(prices)) {
            if (price?.usd === undefined) continue;
            result[makeKey(platform_id, address)] = Number(price.usd);
        }
    }

    return result;
}

const batchedGetTokenPriceByAddress = createBatcher<TokenPricePayload, number>('getTokenPriceByAddress', fetcher, {
    makeKey: (payload) => makeKey(payload.platform_id, payload.address),
    size: 100,
    wait: 100,
});

export async function getTokenPriceByAddress(platform_id: string, address: string) {
    return batchedGetTokenPriceByAddress({ platform_id, address });
}
