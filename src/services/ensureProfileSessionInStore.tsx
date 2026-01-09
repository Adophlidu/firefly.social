import { Trans } from '@lingui/react/macro';

import { type SocialSource } from '@/constants/enum.js';
import { SessionExpiredError } from '@/constants/error.js';
import { enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { logger } from '@/libs/Logger.js';
import { type Account } from '@/providers/types/Account.js';
import { ensureSessionIsValid } from '@/services/ensureSessionIsValid.js';
import { type ProfileState } from '@/store/useProfileStore/createProfileState.js';

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
                <Trans>
                    Failed to resume session for @{account.profile.handle} on {resolveSourceName(source)}, you can
                    refresh the page to try again.
                </Trans>,
            );

            /**
             * Stop checking other accounts if an unexpected error occurs,
             * and keep the current profile session because the session might still be valid.
             * and don't throw error to ensure resuming session process can continue.
             */
            logger.error('ensureProfileSessionInStore', checkErr);
            break;
        }
    }

    if (expiredAccounts.length) {
        enqueueWarningMessage(
            <Trans>
                Session expired for {expiredAccounts.map((x) => `@${x.profile.handle}`).join(', ')} on{' '}
                {resolveSourceName(source)}.
            </Trans>,
        );
    }
    if (!state.accounts.length || !state.currentProfile) {
        state.clear();
    }
}
