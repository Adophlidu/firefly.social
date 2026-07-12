import { runInSafeAsync } from '@dimensiondev/utils';

import { isSameProfile } from '@/helpers/isSameProfile.js';
import { resolveInternalLensHandle } from '@/helpers/resolveInternalLensHandle.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { autoLoginLensAccounts } from '@/providers/lens/autoLoginLensAccounts.js';
import { switchAccount } from '@/services/account.js';
import { useLensProfileStore } from '@/store/useProfileStore/useLensProfileStore.js';

/**
 * Ensure the internally-registered (managed `ff-<uid>`) Lens account is the
 * current Lens account, so opening an Orb/FIFA comment compose defaults the
 * author to it (FW-7902). No-op if it is already current, or if no managed
 * account is available (falls back to whatever is current).
 *
 * `switchAccount` also resumes the Lens session client, so combined with the
 * postToLens re-sync guard (FW-7901) the selected account is the one that
 * actually publishes.
 */
export async function ensureInternalLensAccountCurrent() {
    const uid = fireflySessionHolder.session?.payload?.uid;
    const handle = resolveInternalLensHandle(uid);
    if (!handle) return;

    const find = () => useLensProfileStore.getState().accounts.find((a) => a.profile.handle.toLowerCase() === handle);

    let internal = find();
    if (!internal) {
        // Not loaded yet (e.g. fresh rehydrate): auto-login managed accounts (idempotent), then retry.
        await runInSafeAsync(() => autoLoginLensAccounts());
        internal = find();
    }
    if (!internal) return; // no managed account available — fall back to current

    if (isSameProfile(useLensProfileStore.getState().currentProfile, internal.profile)) return;
    await switchAccount(internal); // makes it current + resumes the session client
}
