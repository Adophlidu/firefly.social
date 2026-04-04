'use client';

import { t } from '@lingui/core/macro';
import { useCallback, useRef, useState } from 'react';
import { useCopyToClipboard } from 'usehooks-ts';

import { enqueueSuccessMessage, type MessageOptions } from '@/helpers/enqueueMessage.js';

export interface ImmediateOptions {
    enqueueSuccessMessage?: boolean;
    messageOptions?: MessageOptions;
}

export function useCopyText(
    text: string,
    options: Pick<ImmediateOptions, 'enqueueSuccessMessage'> = { enqueueSuccessMessage: true },
) {
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const [copied, setCopied] = useState(false);
    const [, copyToClipboard] = useCopyToClipboard();

    const handleCopy = useCallback(
        (immediateText?: string, immediateOptions?: ImmediateOptions) => {
            copyToClipboard(immediateText ?? text);
            setCopied(true);
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(setCopied, 1500, false);
            const finalOptions = { enqueueSuccessMessage: options.enqueueSuccessMessage, ...immediateOptions };
            if (finalOptions.enqueueSuccessMessage) enqueueSuccessMessage(t`Copied`, finalOptions.messageOptions);
        },
        [text, copyToClipboard, options.enqueueSuccessMessage],
    );

    return [copied, handleCopy] as const;
}
