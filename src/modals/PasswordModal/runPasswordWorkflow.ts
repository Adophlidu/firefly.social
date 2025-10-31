import { safeUnreachable, unreachable } from '@firefly/utils';
import { t } from '@lingui/core/macro';

import { queryClient } from '@/configs/queryClient.js';
import { PasswordStep, PasswordWorkflow } from '@/constants/enum.js';
import { FireflyResponseCode } from '@/constants/responseCode.js';
import { enqueueErrorMessage, enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { PasswordModalRef } from '@/modals/PasswordModal/index.js';
import { isStrongDigitPassword, isValidPassword } from '@/modals/PasswordModal/isValidPassword.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { mergeMetrics, uploadMetrics } from '@/services/metrics.js';

type NextStepConfig =
    | {
          workflow?: PasswordWorkflow;
          step?: PasswordStep;
      }
    | undefined;

function checkPassword(password: string) {
    if (!isValidPassword(password)) {
        enqueueWarningMessage(t`Invalid password. Please ensure it is a 6-digit number.`);
        return false;
    }
    if (!isStrongDigitPassword(password)) {
        enqueueWarningMessage(t`Password cannot be a sequence or repeated digits. Please try again.`);
        return false;
    }

    return true;
}

async function verifyPasscodeOnServer(password: string): Promise<boolean> {
    const response = await FireflyEndpointProvider.checkPasscode(password, true);
    if (response.code === FireflyResponseCode.SUCCESS) return true;

    if (
        [FireflyResponseCode.PASSCODE_INCORRECT, FireflyResponseCode.PASSCODE_INCORRECT_TOO_MANY_TIMES].includes(
            response.code,
        )
    ) {
        const data = response.data || {};
        if ('remainTryTimes' in data && 'retryTimes' in data) {
            const remainTryTimes = data.remainTryTimes as number;
            if (remainTryTimes <= 0) {
                enqueueErrorMessage(t`Multi-device login is now turned off and all previously sessions are cleared.`);
                PasswordModalRef.close();
                queryClient.setQueryData(['session-sync-status', true], false);
                return false;
            }
            enqueueWarningMessage(
                remainTryTimes > 2
                    ? t`The password you entered is incorrect. Please try again.`
                    : t`${remainTryTimes} more incorrect password attempts will clear all your encrypted login sessions.`,
            );
            return false;
        }
    }

    enqueueWarningMessage(t`The password you entered is incorrect. Please try again.`);
    return false;
}

async function setPassword(
    step: PasswordStep,
    passwords: Record<PasswordStep, string>,
    shouldReset = false,
    autoUploadMetrics = true,
): Promise<NextStepConfig> {
    const password = passwords[step];

    switch (step) {
        case PasswordStep.SetPassword: {
            if (!checkPassword(password)) return;
            return { step: PasswordStep.ConfirmPassword };
        }
        case PasswordStep.ConfirmPassword: {
            if (password !== passwords[PasswordStep.SetPassword]) {
                enqueueWarningMessage(t`The passwords you entered don’t match. Please try again.`);
                return;
            }
            if (shouldReset) {
                await FireflyEndpointProvider.resetPasscode();
            }
            await FireflyEndpointProvider.setPasscode(password);
            if (autoUploadMetrics) {
                await runInSafeAsync(() => uploadMetrics(password));
            }
            enqueueSuccessMessage(
                shouldReset
                    ? t`Password updated successfully.`
                    : t`Multi-device login is now turned on and synced successfully.`,
            );
            return { step: PasswordStep.Success };
        }
        case PasswordStep.ChangePassword:
        case PasswordStep.VerifyPassword:
            enqueueWarningMessage(t`Unexpected step for setting password: ${step}.`);
            return;
        case PasswordStep.Success:
            return;
        default:
            safeUnreachable(step);
            return;
    }
}

async function changePassword(
    step: PasswordStep,
    passwords: Record<PasswordStep, string>,
    autoUploadMetrics = true,
): Promise<NextStepConfig> {
    const password = passwords[step];

    switch (step) {
        // check old password
        case PasswordStep.SetPassword: {
            if (!(await verifyPasscodeOnServer(password))) return;
            return { step: PasswordStep.ChangePassword };
        }
        case PasswordStep.ChangePassword: {
            if (password === passwords[PasswordStep.SetPassword]) {
                enqueueWarningMessage(t`New password cannot be the same as the old one. Please try again.`);
                return;
            }

            if (!checkPassword(password)) return;
            return { step: PasswordStep.ConfirmPassword };
        }
        case PasswordStep.ConfirmPassword: {
            if (password !== passwords[PasswordStep.ChangePassword]) {
                enqueueWarningMessage(t`The passwords you entered don’t match. Please try again.`);
                return;
            }
            await FireflyEndpointProvider.updatePasscode(passwords[PasswordStep.SetPassword], password);
            if (autoUploadMetrics) {
                await runInSafeAsync(() => mergeMetrics(password, false));
            }
            enqueueSuccessMessage(t`Password updated successfully.`);
            return { step: PasswordStep.Success };
        }
        case PasswordStep.VerifyPassword:
        case PasswordStep.Success:
            return;
        default:
            safeUnreachable(step);
            return;
    }
}

async function verifyPassword(step: PasswordStep, passwords: Record<PasswordStep, string>): Promise<NextStepConfig> {
    switch (step) {
        case PasswordStep.VerifyPassword: {
            if (!(await verifyPasscodeOnServer(passwords[step]))) return;
            return { step: PasswordStep.Success };
        }
        case PasswordStep.Success:
            return;
        case PasswordStep.SetPassword:
        case PasswordStep.ChangePassword:
        case PasswordStep.ConfirmPassword:
            enqueueWarningMessage(t`Unexpected step for verifying password: ${step}.`);
            return;
        default:
            safeUnreachable(step);
            return;
    }
}

async function resetPassword(
    step: PasswordStep,
    passwords: Record<PasswordStep, string>,
    autoUploadMetrics = true,
): Promise<NextStepConfig> {
    return setPassword(step, passwords, true, autoUploadMetrics);
}

export async function runPasswordWorkflow(
    workflow: PasswordWorkflow,
    step: PasswordStep,
    passwords: Record<PasswordStep, string>,
    autoUploadMetrics = true,
): Promise<NextStepConfig> {
    switch (workflow) {
        case PasswordWorkflow.Set:
            return await setPassword(step, passwords, false, autoUploadMetrics);
        case PasswordWorkflow.Change:
            return await changePassword(step, passwords, autoUploadMetrics);
        case PasswordWorkflow.Verify:
            return await verifyPassword(step, passwords);
        case PasswordWorkflow.Reset:
            return await resetPassword(step, passwords, autoUploadMetrics);
        default:
            unreachable(workflow);
    }
}
