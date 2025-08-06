import { Source } from '@/constants/enum.js';
import { memoizePromise } from '@/helpers/memoizePromise.js';
import { resolveFireflyProfiles } from '@/helpers/resolveFireflyProfiles.js';
import { getAllPlatformProfileByIdentity } from '@/providers/firefly/getAllPlatformProfileByIdentity.js';

async function resolver(addressOrEns: string, isAuthRequired: boolean) {
    const identity = { id: addressOrEns, source: Source.Wallet } as const;
    const profiles = await getAllPlatformProfileByIdentity(identity, isAuthRequired);
    const { walletProfile } = resolveFireflyProfiles(identity, profiles);
    return walletProfile;
}

export const getWalletProfileByAddressOrEns = memoizePromise(
    resolver,
    (addressOrEns, isAuthRequired) => `${addressOrEns}_${isAuthRequired}`,
);
