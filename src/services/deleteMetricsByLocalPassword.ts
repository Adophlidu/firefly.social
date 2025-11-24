import { FireflyResponseCode } from '@/constants/responseCode.js';
import { resolveSocialSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { checkPasscode } from '@/providers/firefly/metrics/checkPasscode.js';
import { deleteMetrics } from '@/providers/firefly/metrics/deleteMetrics.js';
import type { Account } from '@/providers/types/Account.js';
import { useTokenPasswordStore } from '@/store/useTokenPasswordStore.js';

export async function deleteMetricsByLocalPassword(account: Account) {
    const localPassword = useTokenPasswordStore.getState().password;
    if (!localPassword) return;

    const result = await checkPasscode(localPassword, true);
    if (result?.code === FireflyResponseCode.SUCCESS) {
        await deleteMetrics(localPassword, [
            `${resolveSocialSourceInUrl(account.profile.source)}:${account.profile.profileId}`,
        ]);
    }

    return;
}
