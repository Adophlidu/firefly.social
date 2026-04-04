import { EMPTY_LIST } from '@dimensiondev/constants';
import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { type GetMultiChainTokenListResponse, type TokenAsset } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getMultiChainTokenList(addresses: string[], chains: number[]) {
    // cspell: disable-next-line
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/swap/wallet/asset/muti-chain', {
        chains: chains.join(','),
        addresses: addresses.join(','),
    });
    const response = await fetchJson<GetMultiChainTokenListResponse>(url);
    return (response.data?.data?.tokenAssets ?? EMPTY_LIST) as TokenAsset[];
}
