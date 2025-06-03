import { t } from '@lingui/core/macro';
import { safeUnreachable, unreachable } from '@masknet/kit';

import { PasswordStep, PasswordWorkflow } from '@/constants/enum.js';
import { FireflyResponseCode } from '@/constants/responseCode.js';
import { enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { isStrongDigitPassword, isValidPassword } from '@/modals/PasswordModal/isValidPassword.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

type NextStepConfig =
    | {
          workflow?: PasswordWorkflow;
          step?: PasswordStep;
      }
    | undefined;

function checkPassword(password: string) {
    if (!isValidPassword(password.split(''))) {
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

    if (response.code === FireflyResponseCode.PASSCODE_INCORRECT) {
        const data = response.data || {};
        if ('remainTryTimes' in data && 'retryTimes' in data) {
            const remainTryTimes = data.remainTryTimes as number;
            const retryTimes = data.retryTimes as number;
            enqueueWarningMessage(
                retryTimes === 1
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
            enqueueSuccessMessage(t`Multi-device login is now turned on and synced successfully.`);
            return { step: PasswordStep.Success };
        }
        case PasswordStep.ChangePassword:
            enqueueWarningMessage(t`Unexpected step for setting password: ${step}.`);
            return;
        case PasswordStep.Success:
            return;
        default:
            safeUnreachable(step);
            return;
    }
}

async function changePassword(step: PasswordStep, passwords: Record<PasswordStep, string>): Promise<NextStepConfig> {
    const password = passwords[step];

    switch (step) {
        // check old password
        case PasswordStep.SetPassword: {
            if (!(await verifyPasscodeOnServer(password))) return;
            return { step: PasswordStep.ChangePassword };
        }
        case PasswordStep.ChangePassword: {
            if (!checkPassword(password)) return;
            return { step: PasswordStep.ConfirmPassword };
        }
        case PasswordStep.ConfirmPassword: {
            if (password !== passwords[PasswordStep.ChangePassword]) {
                enqueueWarningMessage(t`The passwords you entered don’t match. Please try again.`);
                return;
            }
            await FireflyEndpointProvider.updatePasscode(passwords[PasswordStep.SetPassword], password);
            enqueueSuccessMessage(t`Password updated successfully.`);
            return { step: PasswordStep.Success };
        }
        case PasswordStep.Success:
            return;
        default:
            safeUnreachable(step);
            return;
    }
}

async function verifyPassword(step: PasswordStep, passwords: Record<PasswordStep, string>): Promise<NextStepConfig> {
    switch (step) {
        case PasswordStep.SetPassword: {
            if (!(await verifyPasscodeOnServer(passwords[step]))) return;
            return { step: PasswordStep.Success };
        }
        case PasswordStep.Success:
            return;
        case PasswordStep.ChangePassword:
        case PasswordStep.ConfirmPassword:
            enqueueWarningMessage(t`Unexpected step for verifying password: ${step}.`);
            return;
        default:
            safeUnreachable(step);
            return;
    }
}

async function resetPassword(step: PasswordStep, passwords: Record<PasswordStep, string>): Promise<NextStepConfig> {
    return setPassword(step, passwords, true);
}

export async function runPasswordWorkflow(
    workflow: PasswordWorkflow,
    step: PasswordStep,
    passwords: Record<PasswordStep, string[]>,
): Promise<NextStepConfig> {
    const passwordRecord = Object.fromEntries(
        Object.entries(passwords).map(([key, value]) => [key, value.join('')]),
    ) as Record<PasswordStep, string>;

    switch (workflow) {
        case PasswordWorkflow.Set:
            return await setPassword(step, passwordRecord);
        case PasswordWorkflow.Change:
            return await changePassword(step, passwordRecord);
        case PasswordWorkflow.Verify:
            return await verifyPassword(step, passwordRecord);
        case PasswordWorkflow.Reset:
            return await resetPassword(step, passwordRecord);
        default:
            unreachable(workflow);
    }
}
