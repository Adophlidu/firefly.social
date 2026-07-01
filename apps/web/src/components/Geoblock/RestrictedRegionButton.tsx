'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Tooltip } from '@/components/Tooltip.js';

interface RestrictedRegionButtonProps {
    className?: string;
}

export const RestrictedRegionButton = memo<RestrictedRegionButtonProps>(function RestrictedRegionButton({ className }) {
    return (
        <Tooltip content={<Trans>This feature is currently unavailable in your region.</Trans>}>
            <ClickableButton
                className={classNames(
                    'cursor-not-allowed rounded-lg bg-[var(--color-bg03)] px-4 py-2 text-sm font-bold leading-6 text-second',
                    className,
                )}
                disabled
                type="button"
            >
                <Trans>Restricted Region</Trans>
            </ClickableButton>
        </Tooltip>
    );
});
