'use client';

import { memo, type MouseEvent } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { type SocialSource } from '@/constants/enum.js';
import { SignupModalRef } from '@/modals/SignupModal/index.js';
import { captureSocialSignupEntryClickEvent } from '@/providers/telemetry/captureSocialAccountSignupEvent.js';

interface SignupEntryProps extends ClickableButtonProps {
    source: SocialSource;
}

export const SignupEntry = memo<SignupEntryProps>(function SignupEntry({ source, children, onClick, ...rest }) {
    const [{ loading }, handleSignup] = useAsyncFn(
        async (event: MouseEvent<HTMLButtonElement>) => {
            onClick?.(event);

            captureSocialSignupEntryClickEvent(source);
            SignupModalRef.open({ source });
        },
        [source, onClick],
    );

    return (
        <ClickableButton {...rest} disabled={loading || rest.disabled} onClick={handleSignup}>
            {children}
        </ClickableButton>
    );
});
