import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { extractIpfsCID } from '@/helpers/isIpfsCID.js';
import type { TakoExternalHostedData } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getTakoExternalHostedData(ipfs: string) {
    const cid = extractIpfsCID(ipfs);
    const url = urlcat(settings.FIREFLY_ROOT_URL, `/v2/farcaster-hub/ipfs/${cid}`);
    const response = await fetchJson<TakoExternalHostedData>(url);
    return response.data;
}
