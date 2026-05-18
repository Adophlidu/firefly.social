import { PasswordStep, PasswordWorkflow } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';

interface ModalActionsProps {
    workflow: PasswordWorkflow;
    step: PasswordStep;
    confirmDisabled?: boolean;
    confirmLoading?: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
}

export const ModalActions = memo<ModalActionsProps>(function ModalActions({
    workflow,
    step,
    confirmDisabled,
    confirmLoading,
    onConfirm,
    onCancel,
}) {
    const confirmText = [
        [PasswordWorkflow.Set, [PasswordStep.SetPassword]],
        [PasswordWorkflow.Change, [PasswordStep.ChangePassword]],
        [PasswordWorkflow.Reset, [PasswordStep.SetPassword]],
        [PasswordWorkflow.Verify, [PasswordStep.VerifyPassword]],
    ].some(([w, s]) => w === workflow && s.includes(step)) ? (
        <Trans>Continue</Trans>
    ) : (
        <Trans>Confirm</Trans>
    );

    return (
        <div className="flex items-center gap-2">
            <ClickableButton
                onClick={onCancel}
                className="border-main text-medium text-fourMain h-10 flex-1 rounded-full border font-bold leading-10"
            >
                <Trans>Cancel</Trans>
            </ClickableButton>
            <ClickableButton
                disabled={confirmDisabled}
                loading={confirmLoading}
                onlyLoading
                onClick={onConfirm}
                className="bg-main text-medium text-primaryBottom h-10 flex-1 rounded-full font-bold leading-10"
            >
                {confirmText}
            </ClickableButton>
        </div>
    );
});
