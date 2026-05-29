import { PasswordWorkflow } from '@dimensiondev/enums';

import { FireflyResponseCode } from '@/constants/responseCode.js';
import { openAndWaitForClosePasswordModal } from '@/helpers/openPasswordModal.js';
import type { StepDescriptions } from '@/modals/PasswordModal/StepDescription.js';
import { checkPasscode } from '@/providers/firefly/metrics/checkPasscode.js';
import { getMetricsStatus } from '@/providers/firefly/metrics/getMetricsStatus.js';
import { useTokenPasswordStore } from '@/store/useTokenPasswordStore.js';

interface VerifyAndGetPasswordOptions {
    skipCheck?: boolean;
    autoUploadMetrics?: boolean;
    requireSetPassword?: boolean;
    descriptions?: StepDescriptions;
}

export async function verifyAndGetPassword(config?: VerifyAndGetPasswordOptions) {
    const { skipCheck = false, autoUploadMetrics = true, requireSetPassword = false, descriptions } = config ?? {};
    const localPassword = useTokenPasswordStore.getState().password;
    const status = await getMetricsStatus();
    if (!status.hasSetPasscode) {
        if (!requireSetPassword) return null;
        const result = await openAndWaitForClosePasswordModal({
            workflow: PasswordWorkflow.Set,
            autoUploadMetrics,
            descriptions,
        });
        if (!result) return null;
        return useTokenPasswordStore.getState().password;
    }
    if (localPassword && !skipCheck) {
        const result = await checkPasscode(localPassword, true);
        if (result?.code === FireflyResponseCode.SUCCESS) {
            return localPassword;
        }
    }
    const result = await openAndWaitForClosePasswordModal({
        workflow: PasswordWorkflow.Verify,
        autoUploadMetrics,
        descriptions,
    });
    if (!result) return null;
    return useTokenPasswordStore.getState().password;
}
