import { FireflyResponseCode } from '@/constants/responseCode.js';
import { getAccountMetricsData } from '@/helpers/getAccountMetricsData.js';
import { isSameAccount } from '@/helpers/isSameAccount.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { logger } from '@/libs/Logger.js';
import { checkPasscode } from '@/providers/firefly/metrics/checkPasscode.js';
import { uploadMetrics as uploadFireflyMetrics } from '@/providers/firefly/metrics/uploadMetrics.js';
import { autoLoginWithPrivy } from '@/providers/lens/autoLoginWithPrivy.js';
import type { LensSession } from '@/providers/lens/Session.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import type { Account } from '@/providers/types/Account.js';
import { useLensProfileStore } from '@/store/useProfileStore/useLensProfileStore.js';
import { useTokenPasswordStore } from '@/store/useTokenPasswordStore.js';

export async function reLoginLensCurrentAccountWithPrivy(account: Account) {
    try {
        const result = await runInSafeAsync(() => autoLoginWithPrivy(account.profile.profileId));
        const accountByPrivy = result?.account;
        if (accountByPrivy && isSameAccount(account, accountByPrivy)) {
            useLensProfileStore.getState().updateCurrentAccount(accountByPrivy);
            await lensSessionHolder.resumeSession(accountByPrivy.session);
            logger.info('re-login succeeded');

            // upload metrics after re-login
            runInSafeAsync(async () => {
                const localPassword = useTokenPasswordStore.getState().password;
                if (!localPassword) return;

                const result = await checkPasscode(localPassword, true);
                if (result?.code !== FireflyResponseCode.SUCCESS) return;

                const metricsData = await getAccountMetricsData(accountByPrivy, localPassword);
                if (metricsData) {
                    await uploadFireflyMetrics(localPassword, [metricsData]);
                }
            });
        }
    } catch (error) {
        logger.error('reLoginLensCurrentAccountWithPrivy failed', error);

        // On error, just re-use the existing session
        useLensProfileStore.getState().updateCurrentAccount(account);
        await lensSessionHolder.resumeSession(account.session as LensSession);
    }
}
