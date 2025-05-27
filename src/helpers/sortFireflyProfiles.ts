import { isSameFireflyIdentity } from '@/helpers/isSameFireflyIdentity.js';
import type { FireflyIdentity, FireflyProfile } from '@/providers/types/Firefly.js';

export function sortFireflyProfiles(identity: FireflyIdentity, a: FireflyProfile, b: FireflyProfile) {
    const priorityA = isSameFireflyIdentity(a.identity, identity) ? 2 : a.isDefault ? 1 : 0;
    const priorityB = isSameFireflyIdentity(b.identity, identity) ? 2 : b.isDefault ? 1 : 0;
    return priorityB - priorityA;
}
