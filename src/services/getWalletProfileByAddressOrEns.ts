import { Source } from '@/constants/enum.js';
import { memoizePromise } from '@/helpers/memoizePromise.js';
import { resolveFireflyProfiles } from '@/helpers/resolveFireflyProfiles.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

async function resolver(addressOrEns: string, isAuthRequired: boolean) {
    const identity = { id: addressOrEns, source: Source.Wallet } as const;
    const profiles = await FireflyEndpointProvider.getAllPlatformProfileByIdentity(identity, isAuthRequired);
    const { walletProfile } = resolveFireflyProfiles(identity, profiles);
    return walletProfile;
}

export const getWalletProfileByAddressOrEns = memoizePromise(
    resolver,
    (addressOrEns, isAuthRequired) => `${addressOrEns}_${isAuthRequired}`,
);
