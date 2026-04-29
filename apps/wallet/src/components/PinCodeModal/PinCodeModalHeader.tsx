import { useAtom, useAtomValue } from 'jotai';
import { memo, useCallback } from 'react';

import { NavigationBar } from '@/components/NavigationBar.js';
import { NavigationBarTitle } from '@/components/PinCodeModal/NavigationBarTitle.js';
import { PinCodeWorkflowSteps } from '@/constants/pinCode.js';
import { isBusyAtom, stepAtom, workflowAtom } from '@/store/pinCode.js';

interface PinCodeModalHeaderProps {
    onClose: (data: null) => void;
}

export const PinCodeModalHeader = memo<PinCodeModalHeaderProps>(function PinCodeModalHeader({ onClose }) {
    const workflow = useAtomValue(workflowAtom);
    const isBusy = useAtomValue(isBusyAtom);
    const [step, setStep] = useAtom(stepAtom);

    const handleBack = useCallback(() => {
        if (!workflow || !step) return;

        const allSteps = PinCodeWorkflowSteps[workflow];
        const stepIndex = allSteps.indexOf(step);
        if (stepIndex > 0) {
            if (isBusy) return;
            setStep(allSteps[stepIndex - 1]);
        } else {
            onClose(null);
        }
    }, [workflow, step, isBusy, setStep, onClose]);

    return (
        <NavigationBar className="shrink-0" onBack={handleBack}>
            <NavigationBarTitle />
        </NavigationBar>
    );
});
