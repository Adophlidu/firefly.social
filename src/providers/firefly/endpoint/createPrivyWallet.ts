import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type PrivyWalletResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function createPrivyWallet() {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/create/privy/user');
    const response = await fireflySessionHolder.fetch<PrivyWalletResponse>(url, {
        method: 'POST',
    });
    return resolveFireflyResponseData(response);
}
