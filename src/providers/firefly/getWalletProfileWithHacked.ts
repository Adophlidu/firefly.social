import { isSameAddress } from '@/helpers/isSameAddress.js';
import { getWalletsStatus } from '@/providers/firefly/getWalletsStatus.js';
import { type WalletProfile } from '@/providers/types/Firefly.js';

export async function getWalletProfileWithHacked(profiles: WalletProfile[]) {
    const walletsStatus = await getWalletsStatus(profiles.map((x) => x.address));
    return profiles.map<WalletProfile>((profile) => ({
        ...profile,
        hacked: walletsStatus.some((x) => isSameAddress(x.address, profile.address) && x.is_hack),
    }));
}
