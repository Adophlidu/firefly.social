import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@dimensiondev/workers-shared/helpers/resolveFireflyResponseData.js';
import { resolveFireflyRootUrl } from '@dimensiondev/workers-shared/helpers/resolveFireflyRootUrl.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { Context } from 'hono';

import { getWalletProfileWithHacked } from '@/metadata/src/firefly-profile/getWalletProfileWithHacked.js';
import { resolveRelatedProfileParams } from '@/metadata/src/firefly-profile/resolveRelatedProfileParams.js';
import type {
    PlatformIdentityKey,
    WalletProfileResponse,
    WalletProfiles,
} from '@/metadata/src/firefly-profile/types.js';

export async function getAllRelatedProfileInfo(options: Partial<Record<PlatformIdentityKey, string>>, c: Context) {
    const params = await resolveRelatedProfileParams(options, c);
    const url = urlcat(resolveFireflyRootUrl(c), '/v2/wallet/profileinfo', params);
    const response = await fetchJson<WalletProfileResponse>(url, {
        context: c,
    });

    const data =
        resolveFireflyResponseData(response) ||
        ({
            walletProfiles: [],
            lensProfilesV3: [],
            farcasterProfiles: [],
            twitterProfiles: [],
            solanaWalletProfiles: [],
            bskyProfiles: [],
        } satisfies WalletProfiles);
    if (data.walletProfiles.length) data.walletProfiles = await getWalletProfileWithHacked(data.walletProfiles, c);
    return data;
}
