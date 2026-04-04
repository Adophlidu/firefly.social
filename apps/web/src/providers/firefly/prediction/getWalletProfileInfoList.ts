import urlcat from 'urlcat';

import { type PredictionPlatform } from '@/constants/enum.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type WalletProfileInfoListResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

// cspell:ignore platorm
export async function getWalletProfileInfoList(address: string, platform: PredictionPlatform, isProxyAddress = false) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/wallet/profileinfo/list');
    const response = await fireflySessionHolder.fetch<WalletProfileInfoListResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            walletAddress: [address],
            is_polymarketProxy: isProxyAddress,
            // Note: API has a typo - "betsPlatorm" instead of "betsPlatform"
            betsPlatorm: platform,
        }),
    });
    return response;
}
