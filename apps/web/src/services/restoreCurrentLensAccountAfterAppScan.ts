import { Source } from '@/constants/enum.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { setPrivyAsLensManager } from '@/providers/lens/setPrivyAsLensManager.js';
import type { Account } from '@/providers/types/Account.js';
import { switchAccount } from '@/services/account.js';

export async function restoreCurrentLensAccountAfterAppScan(accounts: Account[]) {
    const currentLensAccount = accounts.find((account) => account.profile.source === Source.Lens);
    if (!currentLensAccount) return;

    const currentLensProfile = getCurrentProfileFromStorage(Source.Lens);
    if (!isSameProfile(currentLensAccount.profile, currentLensProfile)) {
        await switchAccount(currentLensAccount, { bindLensManager: false });
    }

    await runInSafeAsync(() => setPrivyAsLensManager(currentLensAccount));
}
