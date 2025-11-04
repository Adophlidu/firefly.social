import urlcat from 'urlcat';

import { isSameAddress } from '@/helpers/isSameAddress.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolveRelatedProfileParams } from '@/providers/firefly/resolve.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import {
    type PlatformIdentityKey,
    type WalletProfile,
    type WalletProfileResponse,
    type WalletProfiles,
    type WalletsStatusResponse,
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

async function getWalletsStatus(addresses: string[]) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/wallet/status');
    const response = await fireflySessionHolder.fetch<WalletsStatusResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            addresses,
        }),
    });
    return resolveFireflyResponseData(response);
}

async function getWalletProfileWithHacked(profiles: WalletProfile[]) {
    const walletsStatus = await getWalletsStatus(profiles.map((x) => x.address));
    return profiles.map<WalletProfile>((profile) => ({
        ...profile,
        hacked: walletsStatus.some((x) => isSameAddress(x.address, profile.address) && x.is_hack),
    }));
}

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
