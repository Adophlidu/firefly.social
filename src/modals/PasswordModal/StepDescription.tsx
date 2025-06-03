import { Trans } from '@lingui/react/macro';
import { memo, type ReactNode } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { PasswordStep, PasswordWorkflow } from '@/constants/enum.js';

interface StepDescriptionProps {
    workflow: PasswordWorkflow;
    step: PasswordStep;
    onWorkflowChange?: (workflow: PasswordWorkflow) => void;
}

type StepDescriptions = Partial<Record<`${PasswordWorkflow}-${PasswordStep}`, ReactNode>>;

export const StepHeaderDescription = memo<StepDescriptionProps>(function StepDescription({ workflow, step }) {
    const descriptions: StepDescriptions = {
        [`${PasswordWorkflow.Set}-${PasswordStep.SetPassword}`]: (
            <Trans>Set a 6-digit password to verify your identity for multi-device login.</Trans>
        ),
        [`${PasswordWorkflow.Change}-${PasswordStep.SetPassword}`]: (
            <Trans>Enter your password to confirm your identity.</Trans>
        ),
        [`${PasswordWorkflow.Change}-${PasswordStep.ChangePassword}`]: (
            <Trans>Enter a new password to verify your identity.</Trans>
        ),
        [`${PasswordWorkflow.Reset}-${PasswordStep.SetPassword}`]: (
            <Trans>Resetting your 6-digit password will clear all previously encrypted login sessions.</Trans>
        ),
    };
    const description = descriptions[`${workflow}-${step}`];

    return description ? <p className="text-medium leading-[18px] text-second">{description}</p> : null;
});

export const StepFooterDescription = memo<StepDescriptionProps>(function StepDescription({
    workflow,
    step,
    onWorkflowChange,
}) {
    const descriptions: StepDescriptions = {
        [`${PasswordWorkflow.Change}-${PasswordStep.SetPassword}`]: (
            <Trans>
                Forgot your password?{' '}
                <ClickableButton
                    className="text-highlight"
                    onClick={() => {
                        onWorkflowChange?.(PasswordWorkflow.Reset);
                    }}
                >
                    Reset password
                </ClickableButton>
            </Trans>
        ),
    };
    const description = descriptions[`${workflow}-${step}`];

    return description ? <p className="text-medium leading-[18px] text-second">{description}</p> : null;
});
