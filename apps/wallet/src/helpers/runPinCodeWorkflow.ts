import { PinCodeModal } from '@/components/PinCodeModal/index.js';
import { queryClient } from '@/configs/queryClient.js';
import { PinCodeWorkflow } from '@/constants/pinCode.js';
import { getSecuritySettingsQuery } from '@/queries/firefly/getSecuritySettingsQuery.js';
import { store } from '@/store/index.js';
import { emailAtom, workflowAtom } from '@/store/pinCode.js';

export async function runPinCodeWorkflow(workflow: PinCodeWorkflow, email?: string) {
    // reset workflow state
    store.set(workflowAtom, workflow);

    // ensure email is fetched
    let pinEmail = email;
    if (workflow === PinCodeWorkflow.ResetPinCode && !pinEmail) {
        const data = await queryClient.ensureQueryData(getSecuritySettingsQuery());
        pinEmail = data?.email;

        if (!pinEmail) {
            throw new Error('No email associated with PIN code. Please set an email before resetting your PIN code.');
        }
    }
    if (pinEmail) {
        store.set(emailAtom, pinEmail);
    }

    return PinCodeModal.call({});
}
