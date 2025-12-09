import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type CheckBatchCustodyWalletResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function checkBatchCustodyWallet(fids: string[]) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/farcaster_account/checkBatchCustodyWallet', {
        fids: fids.join(','),
    });

    const response = await fireflySessionHolder.fetch<CheckBatchCustodyWalletResponse>(url);
    const data = resolveFireflyResponseData(response);
    return data;
}
