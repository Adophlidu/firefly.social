import { tokenWorker } from '@dimensiondev/workers-client';
import type { CoinGeckoToken, GetTokenOptions } from '@dimensiondev/workers-token';

export async function searchToken(options: GetTokenOptions): Promise<CoinGeckoToken | null> {
    const res = await tokenWorker.token.search.$get({
        query: options as Record<string, string>,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? (json.data as CoinGeckoToken | null) : null;
}
