'use client';

import { Trans } from '@lingui/react/macro';
import { useState } from 'react';
import { useAsyncFn } from 'react-use';
import { useInterval } from 'usehooks-ts';

import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { OTPExceededMaximumLimit } from '@/constants/error.js';
import { EMAIL_REGEX } from '@/constants/regexp.js';
import { enqueueMessageFromError, enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { generateEmailOTP } from '@/providers/firefly/auth/generateEmailOTP.js';

interface Props {
    email: string;
    disabled: boolean;
}

export function SendPasscodeButton({ email, disabled }: Props) {
    const [isFirstSendCode, setIsFirstSendCode] = useState(true);
    const [secondsLeft, setSecondsLeft] = useState(0);

    useInterval(
        () => {
            setSecondsLeft((prev) => prev - 1);
        },
        secondsLeft > 0 ? 1000 : null,
    );

    const [{ loading }, handleSendPasscode] = useAsyncFn(async () => {
        if (!EMAIL_REGEX.test(email)) {
            enqueueWarningMessage(<Trans>Sorry, the email you entered is invalid</Trans>);
            return;
        }
        if (secondsLeft > 0) return;

        try {
            await generateEmailOTP(email);
            if (isFirstSendCode) setIsFirstSendCode(false);
            setSecondsLeft(60);
            enqueueSuccessMessage(<Trans>One-time passcode sent to you</Trans>);
        } catch (error) {
            if (error instanceof OTPExceededMaximumLimit) {
                enqueueWarningMessage(
                    <Trans>You have exceeded the maximum number of attempts. Please try again later.</Trans>,
                );
            } else {
                enqueueMessageFromError(error, <Trans>Failed to send.</Trans>);
            }
            throw error;
        }
    }, [secondsLeft, email, isFirstSendCode]);

    return (
        <ClickableButton
            loading={loading}
            onClick={handleSendPasscode}
            disabled={secondsLeft > 0 || loading || disabled}
            className="border-main text-main whitespace-nowrap rounded-lg border bg-transparent px-[22px] py-[5px] text-[13px] font-bold leading-6"
            onlyLoading
        >
            {loading ? (
                <LoadingIcon className="text-primaryBottom size-[18px]" />
            ) : secondsLeft > 0 ? (
                `${secondsLeft}s`
            ) : isFirstSendCode ? (
                <Trans>Send</Trans>
            ) : (
                <Trans>Resend</Trans>
            )}
        </ClickableButton>
    );
}
