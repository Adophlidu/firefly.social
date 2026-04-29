import { Md5, unreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useAsyncFn } from 'react-use';
import { toast } from 'sonner';

import { FireflyApiError } from '@/constants/error.js';
import { PinCodeAction, PinCodeWorkflow, PinCodeWorkflowSteps } from '@/constants/pinCode.js';
import { logger } from '@/lib/Logger.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';
import {
    emailAtom,
    isBusyAtom,
    pinCodeAtom,
    stepAtom,
    stepErrorRecordAtom,
    stepValueRecordAtom,
    workflowAtom,
} from '@/store/pinCode.js';

function getErrorMessage(workflow: PinCodeWorkflow, error: unknown) {
    switch (workflow) {
        case PinCodeWorkflow.Create:
        case PinCodeWorkflow.ResetPinCode:
            return <Trans>Failed to set PIN. Please try again later.</Trans>;
        case PinCodeWorkflow.Authenticate:
        default:
            return error instanceof Error ? error.message : 'An unknown error occurred';
    }
}

async function setPinCode(step: PinCodeAction, valueRecord: Record<PinCodeAction, string>) {
    switch (step) {
        case PinCodeAction.InputCode:
            return;
        case PinCodeAction.ConfirmCode:
            if (valueRecord[step] !== valueRecord[PinCodeAction.InputCode]) {
                throw new Error('* The PINs you entered do not match. Please check and try again.');
            }
            return;
        case PinCodeAction.SetEmail:
            return getFireflyEndpoint().sendCodeToEmail(valueRecord[step]);
        case PinCodeAction.VerifyEmail:
            return getFireflyEndpoint().addPinCode(
                Md5.hashStr(valueRecord[PinCodeAction.InputCode]),
                valueRecord[PinCodeAction.SetEmail],
                valueRecord[step],
            );
        case PinCodeAction.Success:
            return;
        default:
            unreachable(step);
    }
}

async function verifyPinCode(step: PinCodeAction, valueRecord: Record<PinCodeAction, string>) {
    switch (step) {
        case PinCodeAction.InputCode:
            return getFireflyEndpoint().verifyPinCode(Md5.hashStr(valueRecord[step]));
        case PinCodeAction.ConfirmCode:
        case PinCodeAction.SetEmail:
        case PinCodeAction.VerifyEmail:
        case PinCodeAction.Success:
            return;
        default:
            unreachable(step);
    }
}

async function updatePinCode(step: PinCodeAction, valueRecord: Record<PinCodeAction, string>, email: string | null) {
    switch (step) {
        case PinCodeAction.InputCode:
            return;
        case PinCodeAction.ConfirmCode:
            if (valueRecord[step] !== valueRecord[PinCodeAction.InputCode]) {
                throw new Error('* The PINs you entered do not match. Please check and try again.');
            }
            if (!email) {
                throw new Error('* Email is required to reset PIN code.');
            }

            return getFireflyEndpoint().sendCodeToEmail(email);
        case PinCodeAction.VerifyEmail:
            return getFireflyEndpoint().updatePinCode(
                Md5.hashStr(valueRecord[PinCodeAction.InputCode]),
                valueRecord[step],
            );
        case PinCodeAction.SetEmail:
        case PinCodeAction.Success:
            return;
        default:
            unreachable(step);
    }
}

async function updateEmail(step: PinCodeAction, valueRecord: Record<PinCodeAction, string>) {
    switch (step) {
        case PinCodeAction.InputCode:
            return getFireflyEndpoint().verifyPinCode(Md5.hashStr(valueRecord[step]));
        case PinCodeAction.SetEmail:
            return getFireflyEndpoint().sendCodeToEmail(valueRecord[step]);
        case PinCodeAction.VerifyEmail:
            return getFireflyEndpoint().updatePinCodeEmail(
                Md5.hashStr(valueRecord[PinCodeAction.InputCode]),
                valueRecord[PinCodeAction.SetEmail],
                valueRecord[step],
            );
        case PinCodeAction.ConfirmCode:
        case PinCodeAction.Success:
            return;
        default:
            unreachable(step);
    }
}

export function useRunPinCodeWorkflow(onSuccess?: (code: string | null) => void) {
    const workflow = useAtomValue(workflowAtom);
    const [step, setStep] = useAtom(stepAtom);
    const email = useAtomValue(emailAtom);
    const record = useAtomValue(stepValueRecordAtom);
    const savePinCode = useSetAtom(pinCodeAtom);
    const setIsBusy = useSetAtom(isBusyAtom);
    const setErrorMessage = useSetAtom(stepErrorRecordAtom);

    return useAsyncFn(
        async (value?: string) => {
            if (!workflow || !step) return;

            const valueRecord = value ? { ...record, [step]: value } : record;
            try {
                setIsBusy(true);

                switch (workflow) {
                    case PinCodeWorkflow.Create:
                        await setPinCode(step, valueRecord);
                        break;
                    case PinCodeWorkflow.Authenticate:
                        await verifyPinCode(step, valueRecord);
                        break;
                    case PinCodeWorkflow.ResetPinCode:
                        await updatePinCode(step, valueRecord, email);
                        break;
                    case PinCodeWorkflow.ResetEmail:
                        await updateEmail(step, valueRecord);
                        break;
                    default:
                        unreachable(workflow);
                }

                const currentIndex = PinCodeWorkflowSteps[workflow].indexOf(step);
                if (currentIndex === -1) {
                    throw new Error(`Current step ${step} not found in workflow ${workflow}`);
                }

                const nextStep = PinCodeWorkflowSteps[workflow][currentIndex + 1];
                if (nextStep && nextStep !== PinCodeAction.Success) {
                    setStep(nextStep);
                    return;
                }

                // save pin code
                const pinCode = valueRecord[PinCodeAction.InputCode];
                if (pinCode) {
                    savePinCode(pinCode);
                }

                onSuccess?.(pinCode);
            } catch (error) {
                if (
                    [PinCodeWorkflow.Authenticate, PinCodeWorkflow.ResetEmail].includes(workflow) &&
                    step === PinCodeAction.InputCode &&
                    error instanceof FireflyApiError &&
                    error.code?.toString().startsWith('26')
                ) {
                    setErrorMessage((prev) => ({
                        ...prev,
                        [step]: error.message,
                    }));
                } else {
                    toast.error(getErrorMessage(workflow, error));
                }
                logger.error('Error in pin code workflow', { error, workflow, step });
            } finally {
                setIsBusy(false);
            }
        },
        [workflow, step, record, email, setStep, savePinCode, onSuccess, setIsBusy, setErrorMessage],
    );
}
