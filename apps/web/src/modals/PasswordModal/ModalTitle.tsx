import { safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { PasswordStep, PasswordWorkflow } from '@/constants/enum.js';

interface ModalTitleProps {
    workflow: PasswordWorkflow;
    step: PasswordStep;
}

interface TitleProps {
    workflow: PasswordWorkflow;
}

function SetPasswordTitle({ workflow }: TitleProps) {
    switch (workflow) {
        case PasswordWorkflow.Set:
            return <Trans>Set Password</Trans>;
        case PasswordWorkflow.Change:
        case PasswordWorkflow.Verify:
            return <Trans>Password Verification</Trans>;
        case PasswordWorkflow.Reset:
            return <Trans>Reset Password</Trans>;
        default:
            safeUnreachable(workflow);
            return null;
    }
}

function ChangePasswordTitle({ workflow }: TitleProps) {
    switch (workflow) {
        case PasswordWorkflow.Change:
            return <Trans>Change Password</Trans>;
        case PasswordWorkflow.Set:
        case PasswordWorkflow.Verify:
        case PasswordWorkflow.Reset:
            return null;
        default:
            safeUnreachable(workflow);
            return null;
    }
}

export const ModalTitle = memo(function ModalTitle({ workflow, step }: ModalTitleProps) {
    switch (step) {
        case PasswordStep.ConfirmPassword:
            return <Trans>Re-enter Password</Trans>;
        case PasswordStep.SetPassword:
            return <SetPasswordTitle workflow={workflow} />;
        case PasswordStep.ChangePassword:
            return <ChangePasswordTitle workflow={workflow} />;
        case PasswordStep.VerifyPassword:
            return <Trans>Password Verification</Trans>;
        case PasswordStep.Success:
            return null;
        default:
            safeUnreachable(step);
            return null;
    }
});
