import { safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useAtomValue } from 'jotai';
import { memo } from 'react';

import { PinCodeAction, PinCodeWorkflow } from '@/constants/pinCode.js';
import { stepAtom, workflowAtom } from '@/store/pinCode.js';

export const NavigationBarTitle = memo(function NavigationBarTitle() {
    const workflow = useAtomValue(workflowAtom);
    const step = useAtomValue(stepAtom);

    if (!workflow || !step) return null;

    switch (workflow) {
        case PinCodeWorkflow.Create: {
            switch (step) {
                case PinCodeAction.InputCode:
                case PinCodeAction.ConfirmCode:
                    return <Trans>Set PIN Code</Trans>;
                case PinCodeAction.SetEmail:
                    return <Trans>Set Recovery Email</Trans>;
                case PinCodeAction.VerifyEmail:
                    return <Trans>Verify Email</Trans>;
                default:
                    return null;
            }
        }
        case PinCodeWorkflow.Authenticate:
            return <Trans>Authentication</Trans>;
        case PinCodeWorkflow.ResetEmail: {
            switch (step) {
                case PinCodeAction.InputCode:
                    return <Trans>Authentication</Trans>;
                case PinCodeAction.SetEmail:
                    return <Trans>Change Recovery Email</Trans>;
                case PinCodeAction.VerifyEmail:
                    return <Trans>Verify Email</Trans>;
                default:
                    return null;
            }
        }
        case PinCodeWorkflow.ResetPinCode: {
            switch (step) {
                case PinCodeAction.InputCode:
                case PinCodeAction.ConfirmCode:
                    return <Trans>Reset PIN Code</Trans>;
                case PinCodeAction.VerifyEmail:
                    return <Trans>Verify Email</Trans>;
                default:
                    return null;
            }
        }
        default:
            safeUnreachable(workflow);
            return null;
    }
});
