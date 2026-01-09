import urlcat from 'urlcat';

import { COINGECKO_ROOT_URL } from '@/constants/static.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { type Price } from '@/providers/types/CoinGecko.js';

export async function getTokenPrices(platform_id: string, contractAddresses: string[]) {
    const url = urlcat(COINGECKO_ROOT_URL, '/simple/token_price/:platform_id', {
        platform_id,
        contract_addresses: contractAddresses.join(','),
        vs_currencies: 'usd',
    });

    return fetchJson<Record<string, Price>>(url);
}
