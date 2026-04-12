import { isValidAddress } from '@/helpers/isValidAddress.js';
import { isZeroAddress } from '@/helpers/isZeroAddress.js';
import type { Profile as FireflyProfile } from '@/providers/types/Firefly.js';

/**
 * For searching ens, resolves wallet address from various possible fields in a Firefly profile
 */
export function resolveAddressFromProfile(profile: FireflyProfile) {
    const keys = ['resolved_address', 'registrant', 'owner', 'wrapped_owner', 'owner_address'] as const;

    for (const key of keys) {
        const address = profile[key];
        if (typeof address === 'string' && isValidAddress(address) && !isZeroAddress(address)) return address;
    }

    return null;
}
