import { t } from '@lingui/core/macro';
import { memo, useCallback, useState } from 'react';
import { useAsyncFn } from 'react-use';

import { PasswordStep, PasswordWorkflow, PasswordWorkflowConfig } from '@/constants/enum.js';
import { FetchError } from '@/constants/error.js';
import { SESSION_PASSWORD_INPUT_ID } from '@/constants/index.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import type { PasswordModalOpenProps } from '@/modals/PasswordModal/index.js';
import { isValidPassword } from '@/modals/PasswordModal/isValidPassword.js';
import { ModalActions } from '@/modals/PasswordModal/ModalActions.js';
import { ModalTitle } from '@/modals/PasswordModal/ModalTitle.js';
import { PasswordInputPanel } from '@/modals/PasswordModal/PasswordInputPanel.js';
import { runPasswordWorkflow } from '@/modals/PasswordModal/runPasswordWorkflow.js';
import { StepFooterDescription, StepHeaderDescription } from '@/modals/PasswordModal/StepDescription.js';
import {
    captureChangePasscodeEvent,
    captureResetPasscodeEvent,
    captureSetPasscodeEvent,
} from '@/providers/telemetry/capturePasscodeEvent.js';
import { useTokenPasswordStore } from '@/store/useTokenPasswordStore.js';

function createEmptyPasswords(): Record<PasswordStep, string> {
    return {
        [PasswordStep.ChangePassword]: '',
        [PasswordStep.ConfirmPassword]: '',
        [PasswordStep.SetPassword]: '',
        [PasswordStep.Success]: '',
        [PasswordStep.VerifyPassword]: '',
    };
}

async function captureEvent(workflow: PasswordWorkflow) {
    switch (workflow) {
        case PasswordWorkflow.Set:
            return captureSetPasscodeEvent();
        case PasswordWorkflow.Change:
            return captureChangePasscodeEvent();
        case PasswordWorkflow.Reset:
            return captureResetPasscodeEvent();
        case PasswordWorkflow.Verify:
            return;
        default:
            safeUnreachable(workflow);
            return;
    }
}

function getDefaultErrorMessage(workflow: PasswordWorkflow): string {
    switch (workflow) {
        case PasswordWorkflow.Set:
            return t`Failed to set password.`;
        case PasswordWorkflow.Change:
            return t`Failed to change password.`;
        case PasswordWorkflow.Reset:
            return t`Failed to reset password.`;
        case PasswordWorkflow.Verify:
            return t`Failed to verify password.`;
        default:
            safeUnreachable(workflow);
            return t`An unknown error occurred.`;
    }
}

export const PasswordModalContent = memo<
    PasswordModalOpenProps & {
        onClose: (success?: boolean) => void;
    }
>(function PasswordModalContent({ workflow: initialWorkflow, autoUploadMetrics, onClose, descriptions }) {
    const [workflow, setWorkflow] = useState<PasswordWorkflow>(initialWorkflow);
    const [step, setStep] = useState<PasswordStep>(PasswordWorkflowConfig[initialWorkflow][0]);

    const [passwords, setPasswords] = useState<Record<PasswordStep, string>>(createEmptyPasswords());

    const { setPassword } = useTokenPasswordStore();

    const onPasswordChange = useCallback(
        (password: string) => {
            setPasswords((prev) => ({
                ...prev,
                [step]: password,
            }));
        },
        [step],
    );

    const changeWorkflowOrStep = useCallback((newWorkflow?: PasswordWorkflow, newStep?: PasswordStep) => {
        if (newWorkflow) {
            setWorkflow(newWorkflow);
            setPasswords(createEmptyPasswords());
            setStep(newStep || PasswordWorkflowConfig[newWorkflow][0]);
        } else if (newStep) {
            setStep(newStep);
        }
        document.getElementById(SESSION_PASSWORD_INPUT_ID)?.focus();
    }, []);

    const [{ loading }, handleNextStep] = useAsyncFn(async () => {
        try {
            const result = await runPasswordWorkflow(workflow, step, passwords, autoUploadMetrics);
            if (!result) {
                setPasswords((prev) => ({
                    ...prev,
                    [step]: '',
                }));
                return;
            }

            if (result.step === PasswordStep.Success) {
                captureEvent(workflow);
                setPassword(passwords[step]);
                onClose(true);
                return;
            }

            changeWorkflowOrStep(result.workflow, result.step);
        } catch (error) {
            const fetchError = error instanceof FetchError ? error.errorMessage : undefined;
            enqueueErrorMessage(fetchError || getDefaultErrorMessage(workflow), { error });
            throw error;
        }
    }, [passwords, workflow, step, autoUploadMetrics, onClose, changeWorkflowOrStep, setPassword]);

    const onCancel = useCallback(() => {
        onClose();
    }, [onClose]);

    return (
        <div>
            <div className="relative flex w-full flex-col rounded-md bg-lightBottom p-6 text-medium text-lightMain shadow-popover transition-all dark:bg-darkBottom md:rounded-xl">
                <h3 className="flex shrink-0 items-center justify-center">
                    <span className="text-lg font-bold text-main">
                        <ModalTitle workflow={workflow} step={step} />
                    </span>
                </h3>
                <div className="mt-8 space-y-8">
                    <div className="space-y-4">
                        <StepHeaderDescription workflow={workflow} step={step} descriptions={descriptions} />
                        <PasswordInputPanel
                            password={passwords[step]}
                            onPasswordChange={onPasswordChange}
                            onConfirm={handleNextStep}
                        />
                        <StepFooterDescription
                            workflow={workflow}
                            step={step}
                            onWorkflowChange={changeWorkflowOrStep}
                        />
                    </div>
                    <ModalActions
                        workflow={workflow}
                        step={step}
                        onConfirm={handleNextStep}
                        confirmLoading={loading}
                        confirmDisabled={!isValidPassword(passwords[step])}
                        onCancel={onCancel}
                    />
                </div>
            </div>
        </div>
    );
});
