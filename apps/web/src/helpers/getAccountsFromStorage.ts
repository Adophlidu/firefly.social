import { bom, parseJson } from '@dimensiondev/utils';

import type { ProfileSource } from '@/constants/enum.js';
import { resolveProfileStorageKey } from '@/helpers/resolveProfileStorageKey.js';
import { logger } from '@/libs/Logger.js';
import { SessionFactory } from '@/providers/base/SessionFactory.js';
import type { Session } from '@/providers/types/Session.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { ProfileStoreSchema } from '@/schemas/ProfileStore.js';

export interface AccountWithSession {
    profile: Profile;
    session: Session;
}

export function getAccountsFromStorage<T extends ProfileSource>(source: T): AccountWithSession[] {
    const state = bom.localStorage?.getItem(resolveProfileStorageKey(source));
    if (!state) return [];

    const parsed = ProfileStoreSchema.safeParse(parseJson(state));
    if (!parsed.success) {
        logger.error('Failed to parse profile state from storage', parsed.error);
        return [];
    }

    const accountsWithSession = parsed.data.state.accounts
        .map((account) => ({
            profile: account.profile,
            session: account.session ? SessionFactory.createSession(account.session) : null,
        }))
        .filter((account): account is AccountWithSession => account.session !== null);

    // Move current account to the first position
    const currentProfileId = parsed.data.state.currentProfile?.profileId;
    if (currentProfileId) {
        const currentIndex = accountsWithSession.findIndex((account) => account.profile.profileId === currentProfileId);
        if (currentIndex > 0) {
            const [currentAccount] = accountsWithSession.splice(currentIndex, 1);
            accountsWithSession.unshift(currentAccount);
        }
    }

    return accountsWithSession;
}
