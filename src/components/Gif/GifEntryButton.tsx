'use client';

import GifIcon from '@dimensiondev/assets/gif.svg';
import { Trans } from '@lingui/react/macro';
import { useRouter } from '@tanstack/react-router';
import { memo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Tooltip } from '@/components/Tooltip.js';
import { captureGifClickEvent } from '@/providers/telemetry/captureClickEvent.js';

interface GifEntryButtonProps {
    disabled?: boolean;
}

export const GifEntryButton = memo(function GifEntryButton({ disabled = false }: GifEntryButtonProps) {
    const { history } = useRouter();

    return (
        <Tooltip content={<Trans>GIF</Trans>} placement="top" disabled={disabled}>
            <ClickableButton
                className="flex cursor-pointer gap-1 text-main focus:outline-none"
                disabled={disabled}
                onClick={() => {
                    history.push('/gif');
                    captureGifClickEvent();
                }}
            >
                <GifIcon width={24} height={24} />
            </ClickableButton>
        </Tooltip>
    );
});
