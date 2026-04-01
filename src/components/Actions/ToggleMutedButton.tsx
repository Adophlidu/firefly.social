'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo, useMemo, useRef } from 'react';
import { useHover } from 'usehooks-ts';

import MuteIcon from '@/assets/mute.svg';
import UnmuteIcon from '@/assets/unmute.svg';
import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';

enum MuteLabel {
    Mute = 'Mute',
    Unmute = 'Unmute',
    Muted = 'Muted',
}

interface ToggleMutedButtonProps extends Omit<ClickableButtonProps, 'children'> {
    loading: boolean;
    isMuted: boolean;
    variant?: 'text' | 'icon';
}

export const ToggleMutedButton = memo(function ToggleMutedButton({
    loading,
    isMuted,
    className,
    variant = 'text',
    ref,
    ...rest
}: ToggleMutedButtonProps) {
    const hoverRef = useRef<HTMLButtonElement>(null!);
    const isHover = useHover(hoverRef);
    const buttonState = isHover ? MuteLabel.Unmute : MuteLabel.Muted;

    const buttonText = useMemo(() => {
        if (variant === 'icon') {
            if (isMuted) return <UnmuteIcon className="size-4 shrink-0" />;
            return <MuteIcon className="size-4 shrink-0" />;
        }
        if (isMuted) {
            if (loading) return <Trans>Unmuting...</Trans>;
            return isHover ? <Trans>Unmute</Trans> : <Trans>Muted</Trans>;
        }
        return loading ? <Trans>Muting...</Trans> : <Trans>Mute</Trans>;
    }, [isHover, isMuted, loading, variant]);

    const variantClassName = {
        text: 'min-w-[112px]',
        icon: 'w-8 max-w-8',
    }[variant];

    return (
        <ClickableButton
            ref={hoverRef}
            className={classNames(
                'flex h-8 items-center justify-center rounded-full border-danger text-medium font-semibold transition-all',
                buttonState === MuteLabel.Muted ? 'border' : '',
                buttonState === MuteLabel.Unmute ? 'border border-danger border-opacity-50' : '',
                isMuted ? 'bg-danger text-white' : 'text-danger',
                className,
                variantClassName,
            )}
            {...rest}
            disabled={loading}
        >
            {buttonText}
        </ClickableButton>
    );
});
