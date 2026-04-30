import { safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useAtomValue } from 'jotai';
import { memo } from 'react';

import { PinCodeAction, PinCodeWorkflow } from '@/constants/pinCode.js';
import { desensitizeEmail } from '@/helpers/desensitizeEmail.js';
import { emailAtom, stepAtom, workflowAtom } from '@/store/pinCode.js';

export const StepDescription = memo(function StepDescription() {
    const workflow = useAtomValue(workflowAtom);
    const step = useAtomValue(stepAtom);
    const emailAddress = useAtomValue(emailAtom);

    if (!workflow || !step) return null;

    switch (workflow) {
        case PinCodeWorkflow.Create: {
            switch (step) {
                case PinCodeAction.InputCode:
                    return (
                        <Trans>Set a PIN to secure your assets. This code will be used to confirm transactions.</Trans>
                    );
                case PinCodeAction.ConfirmCode:
                    return <Trans>Please re-enter the PIN you just set to confirm.</Trans>;
                case PinCodeAction.SetEmail:
                    return (
                        <Trans>
                            Please enter a valid email address. If you want to reset your PIN code, a verification code
                            will be sent to this email to reset it.
                        </Trans>
                    );
                case PinCodeAction.VerifyEmail:
                    return (
                        <Trans>
                            A 6-digit verification code has been sent to your email. Please enter the code to complete
                            verification.
                        </Trans>
                    );
                default:
                    return null;
            }
        }
        case PinCodeWorkflow.Authenticate:
            return <Trans>Enter the PIN code to verify identity</Trans>;
        case PinCodeWorkflow.ResetEmail: {
            switch (step) {
                case PinCodeAction.InputCode:
                    return <Trans>Enter the PIN code to verify identity</Trans>;
                case PinCodeAction.SetEmail:
                    return (
                        <Trans>
                            Please enter your new email address. We will send a verification code to confirm the change.
                            Once updated, PIN reset codes and security verifications will be sent to this new email.
                        </Trans>
                    );
                case PinCodeAction.VerifyEmail:
                    return (
                        <Trans>
                            A 6-digit verification code has been sent to your email. Please enter the code to complete
                            verification.
                        </Trans>
                    );
                default:
                    return null;
            }
        }
        case PinCodeWorkflow.ResetPinCode: {
            switch (step) {
                case PinCodeAction.InputCode:
                    return <Trans>Enter new PIN</Trans>;
                case PinCodeAction.ConfirmCode:
                    return <Trans>Confirm new PIN</Trans>;
                case PinCodeAction.VerifyEmail:
                    return emailAddress ? (
                        <Trans>
                            To secure your assets, please enter the verification code sent to your recovery email{' '}
                            {desensitizeEmail(emailAddress)} to verify your identity.
                        </Trans>
                    ) : null;
                default:
                    return null;
            }
        }
        default:
            safeUnreachable(workflow);
            return null;
    }
});
