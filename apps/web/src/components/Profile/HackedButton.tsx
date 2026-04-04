'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';

interface HackedButtonProps extends Omit<ClickableButtonProps, 'children'> {}

export const HackedButton = memo(function HackedButton({ className }: HackedButtonProps) {
    return (
        <ClickableButton
            className={classNames(
                'border-danger bg-danger text-medium box-border flex h-8 min-w-[112px] cursor-default items-center justify-center whitespace-nowrap rounded-lg border px-5 font-semibold text-white outline-none transition-all',
                className,
            )}
        >
            <Trans>Hack / Phish</Trans>
        </ClickableButton>
    );
});
