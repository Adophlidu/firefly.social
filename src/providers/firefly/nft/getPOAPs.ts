import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { type PoapResponse } from '@/providers/types/NFTs.js';
import { settings } from '@/settings/index.js';

export async function getPOAPs(wallet: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/wallet/poap', {
        walletAddress: wallet,
    });
    const response = await fetchJson<PoapResponse>(url);
    return response.data;
}
