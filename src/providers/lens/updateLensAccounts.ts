import { MAX_ACCOUNT_COUNT_PER_SOURCE } from '@/constants/static.js';
import { isSameAccount } from '@/helpers/isSameAccount.js';
import type { LensSession } from '@/providers/lens/Session.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import type { Account } from '@/providers/types/Account.js';
import { useLensProfileStore } from '@/store/useProfileStore/useLensProfileStore.js';

export function updateLensAccounts(newAccounts: Account[]) {
    const accounts = useLensProfileStore.getState().accounts;
    const accountsToAdd = newAccounts
        .filter((account) => {
            return !accounts.some((x) => isSameAccount(x, account));
        })
        .slice(0, Math.max(0, MAX_ACCOUNT_COUNT_PER_SOURCE - accounts.length));
    if (!accountsToAdd.length) return;

    accountsToAdd.forEach((account) => {
        useLensProfileStore.getState().addAccount(account, false);
    });
    if (!useLensProfileStore.getState().currentProfileSession) {
        const firstAccount = accountsToAdd[0];
        useLensProfileStore.getState().updateCurrentAccount(firstAccount);
        lensSessionHolder.resumeSession(firstAccount.session as LensSession);
    }
}
