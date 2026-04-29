import { Trans } from '@lingui/react/macro';
import { useAtom, useAtomValue } from 'jotai';
import { memo } from 'react';

import { Button } from '@/components/ui/button.js';
import { PinCodeAction, PinCodeWorkflow } from '@/constants/pinCode.js';
import { errMessageAtom, stepAtom, stepErrorRecordAtom, workflowAtom } from '@/store/pinCode.js';

export const ErrorMessage = memo(function ErrorMessage() {
    const errorMsg = useAtomValue(errMessageAtom);
    const [workflow, setWorkflow] = useAtom(workflowAtom);
    const step = useAtomValue(stepAtom);
    const stepErrorRecord = useAtomValue(stepErrorRecordAtom);

    // CLS
    if (!errorMsg) return <div />;

    if (workflow && step && stepErrorRecord[step]) {
        return (
            <div className="px-8 text-center">
                <p className="bg-danger rounded-md px-2.5 text-[10px] font-bold leading-6 text-white">
                    {stepErrorRecord[step]}
                </p>
                {[PinCodeWorkflow.Authenticate, PinCodeWorkflow.ResetEmail].includes(workflow) &&
                step === PinCodeAction.InputCode ? (
                    <Button
                        variant="link"
                        className="mt-8"
                        onClick={() => {
                            setWorkflow(PinCodeWorkflow.ResetPinCode);
                        }}
                    >
                        <Trans>Forgot your PIN code?</Trans>
                    </Button>
                ) : null}
            </div>
        );
    }

    return <div className="text-danger px-8 text-center text-base">* {errorMsg}</div>;
});
