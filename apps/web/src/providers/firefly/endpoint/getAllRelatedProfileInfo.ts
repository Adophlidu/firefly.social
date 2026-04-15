import { isSameAddress } from '@dimensiondev/web3/utils';
import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { convertBskyHandleToDid } from '@/providers/bsky/convertBskyHandleToDid.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type {
    PlatformIdentityKey,
    WalletProfile,
    WalletProfileResponse,
    WalletProfiles,
    WalletsStatusResponse,
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

async function resolveRelatedProfileParams(options?: Partial<Record<PlatformIdentityKey, string>>) {
    if (options?.bskyHandle) {
        const did = await convertBskyHandleToDid(options.bskyHandle);
        if (did) options.bskyDid = did;
    }
    return options || {};
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
