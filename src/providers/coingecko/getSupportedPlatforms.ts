import { COINGECKO_ROOT_URL } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import type { CoinGeckoPlatform } from '@/providers/types/CoinGecko.js';

export async function getSupportedPlatforms() {
    const response = await fetchJson<CoinGeckoPlatform[]>(`${COINGECKO_ROOT_URL}/asset_platforms`);
    return response.filter((x) => x.id && x.chain_identifier) ?? [];
}
