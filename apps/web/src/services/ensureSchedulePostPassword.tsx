import { PasswordStep, PasswordWorkflow } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';

import { uploadLocalMetrics } from '@/services/metrics.js';
import { verifyAndGetPassword } from '@/services/verifyAndGetPassword.js';
import { useLensProfileStore } from '@/store/useProfileStore/useLensProfileStore.js';

export async function ensureSchedulePostPassword() {
    const password = await verifyAndGetPassword({
        requireSetPassword: true,
        descriptions: {
            [`${PasswordWorkflow.Verify}-${PasswordStep.VerifyPassword}`]: (
                <Trans>
                    Multi-device login is required for schedule post. Enter your password to confirm your identity.
                </Trans>
            ),
            [`${PasswordWorkflow.Set}-${PasswordStep.SetPassword}`]: (
                <Trans>
                    Multi-device login is required for schedule post. Set a 6-digit password to verify your identity.
                </Trans>
            ),
        },
    });
    if (!password) return null;

    await useLensProfileStore.getState().refreshCurrentAccount();
    await uploadLocalMetrics(password);

    return password;
}
