import { t } from '@lingui/core/macro';
import { memo, useCallback, useState } from 'react';
import { useAsyncFn } from 'react-use';

import { CloseButton } from '@/components/IconButton.js';
import { PasswordStep, type PasswordWorkflow, PasswordWorkflowConfig } from '@/constants/enum.js';
import { FetchError } from '@/constants/error.js';
import { METRICS_PASSWORD_LENGTH } from '@/constants/index.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import type { PasswordModalOpenProps } from '@/modals/PasswordModal/index.js';
import { isValidPassword } from '@/modals/PasswordModal/isValidPassword.js';
import { ModalActions } from '@/modals/PasswordModal/ModalActions.js';
import { ModalTitle } from '@/modals/PasswordModal/ModalTitle.js';
import { PasswordInputPanel } from '@/modals/PasswordModal/PasswordInputPanel.js';
import { runPasswordWorkflow } from '@/modals/PasswordModal/runPasswordWorkflow.js';

function createEmptyPasswords(): Record<PasswordStep, string[]> {
    return {
        [PasswordStep.ChangePassword]: Array(METRICS_PASSWORD_LENGTH).fill(''),
        [PasswordStep.ConfirmPassword]: Array(METRICS_PASSWORD_LENGTH).fill(''),
        [PasswordStep.SetPassword]: Array(METRICS_PASSWORD_LENGTH).fill(''),
        [PasswordStep.Success]: Array(METRICS_PASSWORD_LENGTH).fill(''),
    };
}

export const PasswordModalContent = memo<
    PasswordModalOpenProps & {
        onClose: (success?: boolean) => void;
    }
>(function PasswordModalContent({ workflow: initialWorkflow, onClose }) {
    const [workflow, setWorkflow] = useState<PasswordWorkflow>(initialWorkflow);
    const [step, setStep] = useState<PasswordStep>(PasswordWorkflowConfig[initialWorkflow][0]);
    const [passwords, setPasswords] = useState<Record<PasswordStep, string[]>>(createEmptyPasswords());

    const onPasswordChange = useCallback(
        (password: string[]) => {
            setPasswords((prev) => ({
                ...prev,
                [step]: password,
            }));
        },
        [step],
    );

    const [{ loading }, handleNextStep] = useAsyncFn(async () => {
        try {
            const result = await runPasswordWorkflow(workflow, step, passwords);
            if (!result) return;

            if (result.step === PasswordStep.Success) {
                onClose(true);
                return;
            }

            if (result.workflow) {
                setWorkflow(result.workflow);
                setPasswords(createEmptyPasswords());
                setStep(result.step || PasswordWorkflowConfig[result.workflow][0]);
            } else if (result.step) {
                setStep(result.step);
            }
        } catch (error) {
            const fetchError = error instanceof FetchError ? error.errorMessage : undefined;
            enqueueErrorMessage(fetchError || t`Failed to set password.`, { error });
            throw error;
        }
    }, [passwords, workflow, step, onClose]);

    const onCancel = useCallback(() => {
        onClose();
    }, [onClose]);

    return (
        <div>
            <div className="relative flex max-h-[70vh] w-[80vw] max-w-[400px] flex-col rounded-md bg-lightBottom text-medium text-lightMain shadow-popover transition-all dark:bg-darkBottom md:rounded-xl">
                <h3 className="relative h-14 shrink-0 pt-safe">
                    <CloseButton onClick={onCancel} className="absolute left-4 top-4" />
                    <span className="flex h-full w-full items-center justify-center text-lg font-bold text-main">
                        <ModalTitle workflow={workflow} step={step} />
                    </span>
                </h3>
                <div className="mt-8 space-y-8 px-6 pb-6">
                    <PasswordInputPanel password={passwords[step]} onPasswordChange={onPasswordChange} />
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
