'use client';

import { Trans } from '@lingui/react/macro';
import { type TippyProps } from '@tippyjs/react';
import { type HTMLProps } from 'react';

import CopyIcon from '@/assets/copy.svg';
import { Tooltip } from '@/components/Tooltip.js';
import { useCopyText } from '@/hooks/useCopyText.js';

interface Props extends HTMLProps<HTMLButtonElement> {
    notification?: 'tooltip' | 'toast';
    text: string;
    tooltipProps?: Partial<TippyProps>;
    size?: number;
}

export function CopyTextButton({ text, tooltipProps, size = 12, notification, ...rest }: Props) {
    const [copied, handleCopy] = useCopyText(text, { enqueueSuccessMessage: false });
    const showToast = notification === 'toast';
    const button = (
        <button
            {...rest}
            type="button"
            onClick={(e) => {
                rest.onClick?.(e);
                if (showToast) {
                    handleCopy(undefined, {
                        enqueueSuccessMessage: true,
                        messageOptions: {
                            anchorOrigin: {
                                vertical: 'top',
                                horizontal: 'center',
                            },
                        },
                    });
                } else {
                    handleCopy();
                }
            }}
        >
            <CopyIcon width={size} height={size} />
        </button>
    );

    if (showToast) return button;

    return (
        <Tooltip
            content={copied ? <Trans>Copied</Trans> : <Trans>Copy</Trans>}
            placement="top"
            hideOnClick={false}
            interactive
            {...tooltipProps}
        >
            {button}
        </Tooltip>
    );
}
