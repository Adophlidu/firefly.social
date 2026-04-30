import { t } from '@lingui/core/macro';
import { atom } from 'jotai';

import {
    EMAIL_REGEX,
    PIN_CODE_LENGTH,
    PinCodeAction,
    PinCodeWorkflow,
    PinCodeWorkflowSteps,
} from '@/constants/pinCode.js';
import { checkPinStrength } from '@/helpers/checkPinStrength.js';

const initialValueRecord: Record<PinCodeAction, string> = {
    [PinCodeAction.InputCode]: '',
    [PinCodeAction.ConfirmCode]: '',
    [PinCodeAction.SetEmail]: '',
    [PinCodeAction.VerifyEmail]: '',
    [PinCodeAction.Success]: '',
};
const initialErrorRecord: Record<PinCodeAction, string | null> = {
    [PinCodeAction.InputCode]: null,
    [PinCodeAction.ConfirmCode]: null,
    [PinCodeAction.SetEmail]: null,
    [PinCodeAction.VerifyEmail]: null,
    [PinCodeAction.Success]: null,
};

// #region base atom
const baseWorkflowAtom = atom<PinCodeWorkflow | null>(null);
const baseStepAtom = atom<PinCodeAction | null>(null);

export const isBusyAtom = atom(false);
export const emailAtom = atom<string | null>(null);
export const pinCodeAtom = atom<string | null>(null);
export const stepValueRecordAtom = atom<Record<PinCodeAction, string>>({
    ...initialValueRecord,
});
export const stepErrorRecordAtom = atom<Record<PinCodeAction, string | null>>({
    ...initialErrorRecord,
});
// #endregion

// #region derived atom
export const workflowAtom = atom(
    (get) => get(baseWorkflowAtom),
    (_, set, newValue: PinCodeWorkflow | null) => {
        set(baseWorkflowAtom, newValue);

        if (!newValue) {
            set(stepAtom, null);
        } else {
            set(stepAtom, PinCodeWorkflowSteps[newValue][0]);
        }

        set(stepValueRecordAtom, { ...initialValueRecord });
        set(stepErrorRecordAtom, { ...initialErrorRecord });
        set(isBusyAtom, false);
    },
);

export const stepAtom = atom(
    (get) => get(baseStepAtom),
    (get, set, newValue: PinCodeAction | null) => {
        set(baseStepAtom, newValue);
        set(stepErrorRecordAtom, { ...initialErrorRecord });
    },
);

export const errMessageAtom = atom((get) => {
    const step = get(stepAtom);
    const workflow = get(workflowAtom);
    const valueRecord = get(stepValueRecordAtom);
    const email = get(emailAtom);

    if (!step || !workflow) return null;

    const errorRecord = get(stepErrorRecordAtom);
    const errorMessage = errorRecord[step];
    if (errorMessage) return errorMessage;

    const value = valueRecord[step];
    // 1. same pin code confirmation
    if (
        step === PinCodeAction.ConfirmCode &&
        value.length === PIN_CODE_LENGTH &&
        value !== valueRecord[PinCodeAction.InputCode]
    ) {
        return t`The PINs you entered do not match. Please check and try again.`;
    }
    // 2. email format validation
    if (step === PinCodeAction.SetEmail && !!value.length && value.match(EMAIL_REGEX) === null) {
        return t`Please enter a valid email address.`;
    }
    // 3. new email should be different from the old one
    if (PinCodeWorkflow.ResetEmail === workflow && step === PinCodeAction.SetEmail && email && value === email) {
        return t`The new email address you entered is the same as your current one. Please enter a different email address.`;
    }
    // 4. PIN code strength validation
    if (
        [PinCodeWorkflow.Create, PinCodeWorkflow.ResetPinCode].includes(workflow) &&
        step === PinCodeAction.InputCode &&
        value.length === PIN_CODE_LENGTH
    ) {
        const checkResult = checkPinStrength(value);
        if (!checkResult.isValid) return checkResult.message;
    }

    return null;
});

export const buttonDisabledAtom = atom((get) => {
    const step = get(stepAtom);
    const workflow = get(workflowAtom);

    if (!step || !workflow) return false;
    if (step === PinCodeAction.Success) return false;

    const value = get(stepValueRecordAtom)[step];
    if (!value) return true;

    const errorRecord = get(stepErrorRecordAtom);
    const errorMessage = errorRecord[step];
    if (errorMessage) return true;

    if (step !== PinCodeAction.SetEmail && (value.length !== PIN_CODE_LENGTH || !/^\d+$/.test(value))) return true;

    return !!get(errMessageAtom);
});
// #endregion
