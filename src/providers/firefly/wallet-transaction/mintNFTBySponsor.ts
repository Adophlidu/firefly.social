import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type MintBySponsorResponse, type SponsorMintOptions } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function mintNFTBySponsor(options: SponsorMintOptions) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/wallet_transaction/mint/platform');
    const response = await fireflySessionHolder.fetch<MintBySponsorResponse>(url, {
        method: 'POST',
        body: JSON.stringify(options),
    });

    const data = resolveFireflyResponseData(response);
    if (!data.status) throw new Error(data.errormessage || 'Failed to mint');

    return data;
}
