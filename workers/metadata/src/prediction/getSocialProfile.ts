import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import { first } from '@dimensiondev/workers-shared/helpers/first.js';
import { isSameAddress } from '@dimensiondev/workers-shared/helpers/isSameAddress.js';
import { resolveFireflyRootUrl } from '@dimensiondev/workers-shared/helpers/resolveFireflyRootUrl.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { FireflyResponse } from '@dimensiondev/workers-shared/types/firefly.js';
import type { Context } from 'hono';

import type { WalletProfiles } from '@/metadata/src/firefly-profile/types.js';
import { extractFallbackInfo } from '@/metadata/src/helpers/extractFallbackInfo.js';
import type { PredictionPlatform } from '@/metadata/src/prediction/types.js';

interface WalletProfileInfoListResponse {
    walletAddress: Array<Record<string, WalletProfiles>>;
}

export async function getSocialProfile(
    address: string,
    platform: PredictionPlatform,
    isProxyAddress: boolean,
    c: Context,
): Promise<{ name?: string; avatar?: string }> {
    try {
        const url = urlcat(resolveFireflyRootUrl(c), '/v2/wallet/profileinfo/list');
        const response = await fetchJson<FireflyResponse<WalletProfileInfoListResponse>>(url, {
            method: 'POST',
            context: c,
            body: JSON.stringify({
                walletAddress: [address],
                is_polymarketProxy: isProxyAddress,
                // Note: API has a typo - "betsPlatorm" instead of "betsPlatform" // cspell:disable-line
                betsPlatorm: platform, // cspell:disable-line
            }),
        });

        const firstEntry = first(response?.data?.walletAddress);
        if (!firstEntry) return {};

        for (const key in firstEntry) {
            if (isSameAddress(key, address)) {
                const { displayName } = extractFallbackInfo(firstEntry[key], address);
                return { name: displayName };
            }
        }
        return {};
    } catch {
        return {};
    }
}
