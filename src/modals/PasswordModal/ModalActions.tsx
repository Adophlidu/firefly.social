import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import type { PasswordStep, PasswordWorkflow } from '@/constants/enum.js';

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
    return (
        <div className="flex items-center gap-2">
            <ClickableButton
                onClick={onCancel}
                className="h-10 flex-1 rounded-full border border-main text-medium font-bold leading-10 text-fourMain"
            >
                <Trans>Cancel</Trans>
            </ClickableButton>
            <ClickableButton
                disabled={confirmDisabled}
                loading={confirmLoading}
                onlyLoading
                onClick={onConfirm}
                className="h-10 flex-1 rounded-full bg-main text-medium font-bold leading-10 text-primaryBottom"
            >
                <Trans>Confirm</Trans>
            </ClickableButton>
        </div>
    );
});
