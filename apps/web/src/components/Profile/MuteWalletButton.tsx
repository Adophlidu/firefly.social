'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';
import { memo, useState } from 'react';

import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { fireflyWalletProvider } from '@/providers/firefly/Wallet.js';

enum State {
    Mute = 'Mute',
    Unmute = 'Unmute',
    Muted = 'Muted',
}

interface ToggleMuteWalletButtonProps extends Omit<ClickableButtonProps, 'children'> {
    address: string;
    isMuted: boolean;
}

export const ToggleMuteWalletButton = memo(function ToggleMuteWalletButton({
    ref,
    address,
    className,
    isMuted,
    ...rest
}: ToggleMuteWalletButtonProps) {
    const [hovering, setHovering] = useState(false);

    const mutation = useMutation({
        mutationFn: () => {
            if (isMuted) return fireflyWalletProvider.unblockWallet(address);
            return fireflyWalletProvider.blockWallet(address);
        },
    });
    const loading = mutation.isPending;

    const buttonText = isMuted ? (
        hovering && !loading ? (
            <Trans id="unmute-wallet" comment="Unmute (unblock) a wallet — social, not audio">
                Unmute
            </Trans>
        ) : (
            <Trans>Muted</Trans>
        )
    ) : (
        <Trans>Mute</Trans>
    );
    const buttonState = isMuted ? (hovering && !loading ? State.Unmute : State.Muted) : State.Mute;

    return (
        <ClickableButton
            className={classNames(
                'flex h-8 min-w-[100px] items-center justify-center rounded-lg border-danger px-2 text-medium font-semibold transition-all',
                className,
                buttonState === State.Muted ? 'border' : '',
                buttonState === State.Unmute ? 'border border-danger border-opacity-50' : '',
                isMuted ? 'bg-danger text-white' : 'text-danger',
            )}
            {...rest}
            disabled={loading}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            onClick={() => {
                mutation.mutate();
            }}
        >
            {loading ? <LoadingIcon size={16} className="mr-2" /> : null}
            {buttonText}
        </ClickableButton>
    );
});
