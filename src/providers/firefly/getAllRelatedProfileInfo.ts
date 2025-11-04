import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { getWalletProfileWithHacked } from '@/providers/firefly/getWalletProfileWithHacked.js';
import { resolveRelatedProfileParams } from '@/providers/firefly/resolve.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import {
    type PlatformIdentityKey,
    type WalletProfileResponse,
    type WalletProfiles,
} from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

const WALLET_PROFILES_FALLBACK: WalletProfiles = {
    walletProfiles: [],
    lensProfilesV3: [],
    farcasterProfiles: [],
    twitterProfiles: [],
    solanaWalletProfiles: [],
    bskyProfiles: [],
};

export async function getAllRelatedProfileInfo(
    options?: Partial<Record<PlatformIdentityKey, string>>,
    isAuthRequired?: boolean,
) {
    const params = await resolveRelatedProfileParams(options);
    // cspell: disable-next-line
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/wallet/profileinfo', params);
    const response = await fireflySessionHolder.fetch<WalletProfileResponse>(
        url,
        {
            method: 'GET',
            next: {
                revalidate: 1,
            },
        },
        {
            withSession: isAuthRequired,
        },
    );
    const data = resolveFireflyResponseData(response) || WALLET_PROFILES_FALLBACK;
    if (data.walletProfiles.length) data.walletProfiles = await getWalletProfileWithHacked(data.walletProfiles);
    return data;
}
