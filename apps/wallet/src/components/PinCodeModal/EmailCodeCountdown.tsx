import { Trans } from '@lingui/react/macro';
import { useAtomValue } from 'jotai';
import { memo } from 'react';
import { useAsyncFn, useMount } from 'react-use';
import { toast } from 'sonner';
import { useCountdown } from 'usehooks-ts';

import { Button } from '@/components/ui/button.js';
import { PinCodeAction, PinCodeWorkflow } from '@/constants/pinCode.js';
import { logger } from '@/lib/Logger.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';
import { emailAtom, isBusyAtom, stepValueRecordAtom, workflowAtom } from '@/store/pinCode.js';

const COUNTDOWN_SECONDS = 60;

export const EmailCodeCountdown = memo(function EmailCodeCountdown() {
    const workflow = useAtomValue(workflowAtom);
    const email = useAtomValue(emailAtom);
    const valueRecord = useAtomValue(stepValueRecordAtom);
    const isBusy = useAtomValue(isBusyAtom);
    const [value, { startCountdown, resetCountdown }] = useCountdown({
        countStart: 0,
        countStop: COUNTDOWN_SECONDS,
        intervalMs: 1000,
        isIncrement: true,
    });

    useMount(() => {
        startCountdown();
    });

    const emailAddress = !workflow
        ? null
        : workflow === PinCodeWorkflow.ResetPinCode
          ? email
          : valueRecord[PinCodeAction.SetEmail];
    const [{ loading }, resendCode] = useAsyncFn(async () => {
        if (!emailAddress) return;

        try {
            await getFireflyEndpoint().sendCodeToEmail(emailAddress);
            resetCountdown();
            startCountdown();
        } catch (error) {
            logger.error('Failed to resend code to email', { error });
            toast.error(error instanceof Error ? error.message : 'Failed to resend code. Please try again later.');
        }
    }, [emailAddress, startCountdown, resetCountdown]);

    const time = Math.max(0, COUNTDOWN_SECONDS - value);
    const disabled = time > 0 || isBusy || loading;

    return (
        <div className="mt-4 flex justify-center">
            <Button
                variant="outline"
                disabled={disabled}
                loading={loading}
                onClick={disabled ? undefined : resendCode}
                className="border-main text-main h-8 rounded-full border py-1.5 text-[13px] font-bold"
            >
                {time > 0 ? <Trans id="second">{time}s</Trans> : <Trans>Resend</Trans>}
            </Button>
        </div>
    );
});
