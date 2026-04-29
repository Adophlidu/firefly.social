export const PIN_CODE_INPUT_ID = '__pin_code_input__';

export const EMAIL_REGEX = /^[\w.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i;
export const PIN_CODE_LENGTH = 6;

export enum PinCodeAction {
    InputCode = 'InputCode',
    ConfirmCode = 'ConfirmCode',
    SetEmail = 'SetEmail',
    VerifyEmail = 'VerifyEmail',
    Success = 'Success',
}

export enum PinCodeWorkflow {
    Create = 'Create',
    Authenticate = 'Authenticate',
    ResetPinCode = 'Reset',
    ResetEmail = 'ResetEmail',
}

export const PinCodeWorkflowSteps: Record<PinCodeWorkflow, PinCodeAction[]> = {
    [PinCodeWorkflow.Create]: [
        PinCodeAction.InputCode,
        PinCodeAction.ConfirmCode,
        PinCodeAction.SetEmail,
        PinCodeAction.VerifyEmail,
        PinCodeAction.Success,
    ],
    [PinCodeWorkflow.Authenticate]: [PinCodeAction.InputCode, PinCodeAction.Success],
    [PinCodeWorkflow.ResetPinCode]: [
        PinCodeAction.InputCode,
        PinCodeAction.ConfirmCode,
        PinCodeAction.VerifyEmail,
        PinCodeAction.Success,
    ],
    [PinCodeWorkflow.ResetEmail]: [
        PinCodeAction.InputCode,
        PinCodeAction.SetEmail,
        PinCodeAction.VerifyEmail,
        PinCodeAction.Success,
    ],
};
