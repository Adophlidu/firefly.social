'use client';

import type { SocialSource } from '@dimensiondev/enums';
import { memo, type MouseEvent } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { openSignupModal } from '@/helpers/openSignupModal.js';
import { captureSocialSignupEntryClickEvent } from '@/providers/telemetry/captureSocialAccountSignupEvent.js';

interface SignupEntryProps extends ClickableButtonProps {
    source: SocialSource;
}

export const SignupEntry = memo<SignupEntryProps>(function SignupEntry({ source, children, onClick, ...rest }) {
    const [{ loading }, handleSignup] = useAsyncFn(
        async (event: MouseEvent<HTMLButtonElement>) => {
            onClick?.(event);

            captureSocialSignupEntryClickEvent(source);
            openSignupModal({ source });
        },
        [source, onClick],
    );

    return (
        <ClickableButton {...rest} disabled={loading || rest.disabled} onClick={handleSignup}>
            {children}
        </ClickableButton>
    );
});
