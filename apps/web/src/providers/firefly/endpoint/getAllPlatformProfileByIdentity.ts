import { formatFireflyProfilesFromWalletProfiles } from '@/helpers/formatFireflyProfilesFromWalletProfiles.js';
import { getAllPlatformProfileFromFirefly } from '@/providers/firefly/endpoint/getAllPlatformProfileFromFirefly.js';
import { type FireflyIdentity, type FireflyProfile } from '@/providers/types/Firefly.js';

export async function getAllPlatformProfileByIdentity(
    identity: FireflyIdentity,
    isAuthRequired: boolean,
): Promise<FireflyProfile[]> {
    const profiles = await getAllPlatformProfileFromFirefly(identity, isAuthRequired);
    return formatFireflyProfilesFromWalletProfiles(profiles) as FireflyProfile[];
}
