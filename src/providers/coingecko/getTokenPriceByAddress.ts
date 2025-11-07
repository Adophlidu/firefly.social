import { isSameAddress } from '@/helpers/isSameAddress.js';
import { getTokenPrices } from '@/providers/coingecko/getTokenPrices.js';

export async function getTokenPriceByAddress(platform_id: string, address: string) {
    const price = await getTokenPrices(platform_id, [address]);
    const currencies = Object.entries(price).find(([key, value]) => {
        return isSameAddress(key, address) ? value : undefined;
    })?.[1];
    return currencies?.usd ? Number(currencies.usd) : undefined;
}
