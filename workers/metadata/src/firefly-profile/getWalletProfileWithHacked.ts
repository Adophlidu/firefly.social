import { isSameAddress } from '@dimensiondev/workers-shared/helpers/isSameAddress.js';
import type { Context } from 'hono';

import { getWalletsStatus } from '@/metadata/src/firefly-profile/getWalletsStatus.js';
import type { WalletProfile } from '@/metadata/src/firefly-profile/types.js';

export async function getWalletProfileWithHacked(profiles: WalletProfile[], c: Context) {
    const walletsStatus = await getWalletsStatus(
        profiles.map((x) => x.address),
        c,
    );
    return profiles.map<WalletProfile>((profile) => ({
        ...profile,
        hacked: walletsStatus.some((x) => isSameAddress(x.address, profile.address) && x.is_hack),
    }));
}
