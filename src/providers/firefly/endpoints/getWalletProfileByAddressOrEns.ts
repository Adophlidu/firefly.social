import { Source } from '@/constants/enum.js';
import { resolveFireflyProfiles } from '@/helpers/resolveFireflyProfiles.js';
import { getAllPlatformProfileByIdentity } from '@/providers/firefly/endpoints/getAllPlatformProfileByIdentity.js';

export async function getWalletProfileByAddressOrEns(addressOrEns: string, isAuthRequired: boolean) {
    const identity = { id: addressOrEns, source: Source.Wallet } as const;
    const profiles = await getAllPlatformProfileByIdentity(identity, isAuthRequired);
    const { walletProfile } = resolveFireflyProfiles(identity, profiles);
    return walletProfile;
}
