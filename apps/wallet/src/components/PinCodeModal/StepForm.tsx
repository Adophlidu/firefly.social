import { t } from '@lingui/core/macro';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { memo, useCallback } from 'react';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { CodeInputPanel } from '@/components/PinCodeModal/CodeInputPanel.js';
import { EmailCodeCountdown } from '@/components/PinCodeModal/EmailCodeCountdown.js';
import { PIN_CODE_LENGTH, PinCodeAction, PinCodeWorkflow } from '@/constants/pinCode.js';
import { useRunPinCodeWorkflow } from '@/hooks/useRunPinCodeWorkflow.js';
import { isBusyAtom, stepAtom, stepErrorRecordAtom, stepValueRecordAtom, workflowAtom } from '@/store/pinCode.js';

interface StepFormProps {
    onSuccess?: (code: string | null) => void;
}

export const StepForm = memo<StepFormProps>(function StepForm({ onSuccess }) {
    const workflow = useAtomValue(workflowAtom);
    const step = useAtomValue(stepAtom);
    const isBusy = useAtomValue(isBusyAtom);
    const setStepError = useSetAtom(stepErrorRecordAtom);
    const [valueRecord, setValueRecord] = useAtom(stepValueRecordAtom);

    const [{ loading }, runWorkflow] = useRunPinCodeWorkflow(onSuccess);

    const autoVerify =
        !!workflow &&
        !!step &&
        [PinCodeWorkflow.Authenticate, PinCodeWorkflow.ResetEmail].includes(workflow) &&
        step === PinCodeAction.InputCode;
    const onCodeChange = useCallback(
        (code: string) => {
            if (!step) return;

            setValueRecord((prev) => ({
                ...prev,
                [step]: code,
            }));
            setStepError((prev) => ({
                ...prev,
                [step]: null,
            }));

            if (autoVerify && code.length === PIN_CODE_LENGTH && /^\d+$/.test(code)) {
                runWorkflow(code);
            }
        },
        [step, autoVerify, setValueRecord, runWorkflow, setStepError],
    );

    if (!workflow || !step) return null;

    return (
        <div className="w-full px-5">
            {step === PinCodeAction.SetEmail ? (
                <input
                    className="border-third h-12 w-full rounded-lg border px-4 text-base"
                    placeholder={t`Email`}
                    type="email"
                    readOnly={isBusy}
                    value={valueRecord[step]}
                    onChange={(e) => onCodeChange(e.target.value)}
                />
            ) : (
                <CodeInputPanel readOnly={isBusy} code={valueRecord[step]} onCodeChange={onCodeChange} />
            )}
            {step === PinCodeAction.VerifyEmail ? <EmailCodeCountdown /> : null}
            {autoVerify && loading ? (
                <div className="mt-8 flex justify-center">
                    <LoadingIcon />
                </div>
            ) : null}
        </div>
    );
});
