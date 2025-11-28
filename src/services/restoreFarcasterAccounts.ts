import { EMPTY_LIST } from '@/constants/index.js';
import { isSameSession } from '@/helpers/isSameSession.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Account } from '@/providers/types/Account.js';
import type { FarcasterAccountInfoResponse } from '@/providers/types/Firefly.js';
import { createFarcasterFromFirefly } from '@/providers/warpcast/createAccountByFireflyWallet.js';
import { addAccounts } from '@/services/account.js';

async function getFarcasterAccountInfos() {
    const res = await fireflySessionHolder.fetchWithSession<FarcasterAccountInfoResponse>(
        '/api/firefly/farcaster-account-info',
    );
    return res.data || EMPTY_LIST;
}

// Local variable to track restoring status per profile ID
const restoringFarcasterAccounts = new Map<string, 'idle' | 'pending' | 'succeed' | 'failed'>();

export async function restoreFarcasterAccountsIfNeeded(accounts: Account[]): Promise<void> {
    const fireflySession = fireflySessionHolder.session;
    if (!fireflySession) return;

    // previous restoring is not finished yet, skip
    if (restoringFarcasterAccounts.get(fireflySession.profileId) === 'pending') return;

    try {
        restoringFarcasterAccounts.set(fireflySession.profileId, 'pending');

        const farcasterAccountInfos = await getFarcasterAccountInfos();
        if (!farcasterAccountInfos.length) return;

        const loggedInFids = accounts.map((x) => x.profile.profileId);
        const unLoginAccountInfos = farcasterAccountInfos.filter((x) => !loggedInFids.includes(x.fid));

        const allSettled = await Promise.allSettled(
            unLoginAccountInfos.map((info) => createFarcasterFromFirefly(info)),
        );

        if (isSameSession(fireflySessionHolder.session, fireflySession)) {
            const unLoginAccounts = allSettled.filter((x) => x.status === 'fulfilled').map((x) => x.value);
            await addAccounts(fireflySession, unLoginAccounts);
        }
    } catch (error) {
        restoringFarcasterAccounts.set(fireflySession.profileId, 'failed');
    } finally {
        restoringFarcasterAccounts.set(fireflySession.profileId, 'succeed');
    }
}
