import urlcat from 'urlcat';

import { isSameAddress } from '@/helpers/isSameAddress.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { WalletsFollowStatusResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function isFollowingWallet(address: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/follow/wallet');
    const response = await fireflySessionHolder.fetch<WalletsFollowStatusResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            addresses: [address],
        }),
    });
    if (!response.data) return false;
    return response.data.some((x) => x.is_followed && isSameAddress(x.address, address));
}
