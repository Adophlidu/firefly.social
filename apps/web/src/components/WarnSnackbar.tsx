'use client';

import CloseIcon from '@dimensiondev/assets/close.svg';
import InfoIcon from '@dimensiondev/assets/info.svg';
import { ClipboardDocumentCheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/solid';
import { Trans } from '@lingui/react/macro';
import { useCallback, useState } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import type { ErrorReportSnackbarProps } from '@/components/ErrorReportSnackbar.js';
import { useSnackbar } from '@/components/Snackbar.js';
import { useCopyText } from '@/hooks/useCopyText.js';

export function WarnSnackbar({ id, detail, message, ref }: ErrorReportSnackbarProps) {
    const { closeSnackbar } = useSnackbar();
    const [expanded, setExpanded] = useState(false);

    const handleExpandClick = useCallback(() => {
        setExpanded((oldExpanded) => !oldExpanded);
    }, []);

    const handleDismiss = useCallback(() => {
        closeSnackbar(id);
    }, [id, closeSnackbar]);

    const [title, setTitle] = useState(message);

    const name = typeof title !== 'object' ? `${title}` : 'Something wrong';
    const description = typeof detail !== 'object' ? `${detail}` : 'Something wrong';

    const [copied, handleCopy] = useCopyText(`${name}\n\n${description}`, { enqueueSuccessMessage: false });

    return (
        <div ref={ref} className="rounded-[4px] bg-warn">
            <div className="w-full text-sm">
                <div className="p-2 pl-3">
                    <div className="flex max-w-[400px] items-center text-white">
                        <div className="mr-auto flex grow cursor-pointer items-center" onClick={handleExpandClick}>
                            <div className="mr-1 inline-block p-2 text-white">
                                <InfoIcon className="size-[20px] text-white" />
                            </div>
                            <div
                                className="break-word font-bold"
                                ref={(node) => {
                                    // convert jsx to string is too complicated, but in favor of DOM api, it's simple
                                    if (typeof message !== 'object' || !node) return;
                                    setTitle(node.innerText.replaceAll('\n', ' '));
                                }}
                            >
                                {message}
                            </div>
                        </div>
                        <CloseIcon
                            width={16}
                            height={16}
                            className="ml-4 size-4 shrink-0 cursor-pointer text-white"
                            onClick={handleDismiss}
                        />
                    </div>
                </div>
                {detail ? (
                    <div>
                        {expanded ? (
                            <div
                                className="max-h-[90px] max-w-[400px] overflow-auto break-words p-4 pt-0"
                                style={{ scrollbarWidth: 'none' }}
                            >
                                <div className="whitespace-pre-wrap text-sm text-white">{detail}</div>
                            </div>
                        ) : null}
                        <div className="flex px-4 pb-2">
                            <div
                                className="inline-block cursor-pointer text-white underline"
                                onClick={handleExpandClick}
                            >
                                {expanded ? <Trans>Show less</Trans> : <Trans>Show more</Trans>}
                            </div>
                            <ClickableButton
                                className="ml-auto inline-flex cursor-pointer items-center text-white"
                                onClick={() => handleCopy()}
                                aria-label={copied ? 'Copied' : 'Copy warning details'}
                            >
                                {copied ? (
                                    <ClipboardDocumentCheckIcon className="mr-1 size-3" />
                                ) : (
                                    <ClipboardDocumentIcon className="mr-1 size-3" />
                                )}
                                {copied ? <Trans>Copied</Trans> : <Trans>Copy</Trans>}
                            </ClickableButton>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
