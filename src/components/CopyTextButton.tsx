'use client';

import { Trans } from '@lingui/react/macro';
import { type HTMLProps } from 'react';

import CopyIcon from '@/assets/copy.svg';
import { Tooltip, type TooltipProps } from '@/components/Tooltip.js';
import { useCopyText } from '@/hooks/useCopyText.js';

interface Props extends HTMLProps<HTMLButtonElement> {
    text: string;
    tooltipProps?: Partial<TooltipProps>;
    size?: number;
}

export function CopyTextButton({ text, tooltipProps, size = 12, onClick, ...rest }: Props) {
    const [copied, handleCopy] = useCopyText(text, { enqueueSuccessMessage: false });

    return (
        <Tooltip
            content={copied ? <Trans>Copied</Trans> : <Trans>Copy</Trans>}
            placement="top"
            hideOnClick={false}
            interactive
            {...tooltipProps}
        >
            <button {...rest} type="button" onClick={handleCopy}>
                <CopyIcon width={size} height={size} className="ml-1" />
            </button>
        </Tooltip>
    );
}
