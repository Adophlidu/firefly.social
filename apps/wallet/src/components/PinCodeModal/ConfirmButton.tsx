import { Trans } from '@lingui/react/macro';
import { useAtomValue } from 'jotai';
import { memo, useMemo } from 'react';

import { Button } from '@/components/ui/button.js';
import { PinCodeWorkflowSteps } from '@/constants/pinCode.js';
import { useRunPinCodeWorkflow } from '@/hooks/useRunPinCodeWorkflow.js';
import { buttonDisabledAtom, isBusyAtom, stepAtom, workflowAtom } from '@/store/pinCode.js';

interface ConfirmButtonProps {
    onSuccess?: (code: string | null) => void;
}

export const ConfirmButton = memo<ConfirmButtonProps>(function ConfirmButton({ onSuccess }) {
    const disabled = useAtomValue(buttonDisabledAtom);
    const workflow = useAtomValue(workflowAtom);
    const step = useAtomValue(stepAtom);
    const isBusy = useAtomValue(isBusyAtom);

    const [{ loading }, runWorkflow] = useRunPinCodeWorkflow(onSuccess);

    const isLastStep = useMemo(() => {
        if (!workflow || !step) return false;

        const allSteps = PinCodeWorkflowSteps[workflow];
        const stepIndex = allSteps.indexOf(step);
        return stepIndex === allSteps.length - 2; // the last step is Success, so we check if it's the second last step
    }, [workflow, step]);

    if (!workflow || !step) return null;

    return (
        <div className="shrink-0 px-4 pb-4">
            <Button
                variant="primary"
                disabled={disabled || loading || isBusy}
                loading={loading || isBusy}
                onClick={disabled || loading ? undefined : () => runWorkflow()}
                className="bg-main text-primaryBottom h-[48px] w-full rounded-full text-base font-bold"
            >
                {isLastStep ? <Trans>Confirm</Trans> : <Trans>Next</Trans>}
            </Button>
        </div>
    );
});
