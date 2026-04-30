import { Trans } from '@lingui/react/macro';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { memo } from 'react';
import { useAsyncFn } from 'react-use';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button.js';
import { queryClient } from '@/configs/queryClient.js';
import { PinCodeAction, PinCodeWorkflow } from '@/constants/pinCode.js';
import { logger } from '@/lib/Logger.js';
import { getSecuritySettingsQuery } from '@/queries/firefly/getSecuritySettingsQuery.js';
import { emailAtom, errMessageAtom, stepAtom, stepErrorRecordAtom, workflowAtom } from '@/store/pinCode.js';

export const ErrorMessage = memo(function ErrorMessage() {
    const errorMsg = useAtomValue(errMessageAtom);
    const [workflow, setWorkflow] = useAtom(workflowAtom);
    const step = useAtomValue(stepAtom);
    const stepErrorRecord = useAtomValue(stepErrorRecordAtom);

    const setEmail = useSetAtom(emailAtom);

    const [{ loading }, resetCode] = useAsyncFn(async () => {
        try {
            const data = await queryClient.ensureQueryData({
                ...getSecuritySettingsQuery(),
                staleTime: 1000 * 60 * 5, // 5 minutes
            });
            if (!data?.email) {
                throw new Error('No email associated with PIN code.');
            }

            setEmail(data.email);
            setWorkflow(PinCodeWorkflow.ResetPinCode);
        } catch (error) {
            logger.error('Failed to fetch email for PIN code reset', error);
            toast.error(error instanceof Error ? error.message : 'Failed to fetch email for PIN code reset');
        }
    }, [setEmail, setWorkflow]);

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
                    <Button variant="link" className="mt-8" disabled={loading} loading={loading} onClick={resetCode}>
                        <Trans>Forgot your PIN code?</Trans>
                    </Button>
                ) : null}
            </div>
        );
    }

    return <div className="text-danger px-8 text-center text-base">* {errorMsg}</div>;
});
