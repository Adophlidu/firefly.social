import { COINGECKO_ROOT_URL } from '@dimensiondev/constants/static';
import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';

export async function getTokenPrice(coinId: string): Promise<number | undefined> {
    const url = urlcat(COINGECKO_ROOT_URL, '/simple/price', { ids: coinId, vs_currencies: 'usd' });
    const price = await fetchJson<Record<string, Record<string, number>>>(url);
    return price[coinId]?.usd;
}
