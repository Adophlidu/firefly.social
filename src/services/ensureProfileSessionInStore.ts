import { unreachable } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';

import { type SocialSource } from '@/constants/enum.js';
import { SessionExpiredError } from '@/constants/error.js';
import { enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { ensureBskySessionIsValid } from '@/providers/bsky/ensureBskySessionIsValid.js';
import type { BskySession } from '@/providers/bsky/Session.js';
import type { Account } from '@/providers/types/Account.js';
import type { Session } from '@/providers/types/Session.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import type { ProfileState } from '@/store/useProfileStore/createProfileState.js';

async function ensureSessionIsValid(session: Session) {
    switch (session.type) {
        case SessionType.Bsky:
            return ensureBskySessionIsValid(session as BskySession);
        case SessionType.Lens:
        case SessionType.Farcaster:
        case SessionType.Twitter:
        case SessionType.Firefly:
        case SessionType.Apple:
        case SessionType.Google:
        case SessionType.Telegram:
        case SessionType.Email:
            return session;
        default:
            throw unreachable(session.type);
    }
}

export async function ensureProfileSessionInStore(source: SocialSource, state: ProfileState) {
    if (!state.currentProfile || !state.currentProfileSession) {
        state.clear();
        return;
    }

    const currentAccount = state.accounts.find((x) => isSameProfile(x.profile, state.currentProfile));
    if (!currentAccount) {
        state.clear();
        return;
    }

    const sortedAccounts: Account[] = [
        {
            ...currentAccount,
            session: state.currentProfileSession,
        },
        ...state.accounts.filter((x) => !isSameProfile(x.profile, currentAccount.profile)),
    ];
    const expiredAccounts: Account[] = [];

    for (const account of sortedAccounts) {
        try {
            const validSession = await ensureSessionIsValid(account.session);
            state.addAccount(
                {
                    ...account,
                    session: validSession,
                },
                true,
            );
            break;
        } catch (checkErr) {
            if (checkErr instanceof SessionExpiredError) {
                state.removeAccount(account);
                expiredAccounts.push(account);
                continue;
            }

            if (!state.currentProfile) {
                state.updateCurrentAccount(account);
            }

            enqueueWarningMessage(
                t`Failed to resume session for @${account.profile.handle} on ${resolveSourceName(source)}, you can refresh the page to try again.`,
            );

            throw checkErr;
        }
    }

    if (expiredAccounts.length) {
        enqueueWarningMessage(
            t`Session expired for ${expiredAccounts
                .map((x) => `@${x.profile.handle}`)
                .join(', ')} on ${resolveSourceName(source)}.`,
        );
    }
    if (!state.accounts.length) {
        state.clear();
    }
}
