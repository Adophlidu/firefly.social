import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { GetSponsorMintStatusResponse, SponsorMintOptions } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getSponsorMintStatus(options: Omit<SponsorMintOptions, 'contractExt'>) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/wallet_transaction/platform/mint/status');
    const response = await fireflySessionHolder.fetch<GetSponsorMintStatusResponse>(url, {
        method: 'POST',
        body: JSON.stringify(options),
    });

    return resolveFireflyResponseData(response);
}
