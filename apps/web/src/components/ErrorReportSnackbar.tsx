'use client';

import { envs } from '@dimensiondev/envs/web';
import { ExceptionId } from '@dimensiondev/exception-tracker';
import { useReportErrorOnce } from '@dimensiondev/exception-tracker/client';
import { ClipboardDocumentCheckIcon, ClipboardDocumentIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { Trans } from '@lingui/react/macro';
import { type ForwardedRef, type ReactNode, useCallback, useMemo, useState } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { CloseButton } from '@/components/IconButton.js';
import { type SnackbarMessage, useSnackbar } from '@/components/Snackbar.js';
import { useCopyText } from '@/hooks/useCopyText.js';

export interface ErrorReportSnackbarProps {
    id: string;
    detail?: string | ReactNode;
    noReport?: boolean;
    icon?: ReactNode;
    message: SnackbarMessage;
    ref?: ForwardedRef<HTMLDivElement>;
}

export function ErrorReportSnackbar({ id, detail, noReport, icon, message, ref }: ErrorReportSnackbarProps) {
    const { closeSnackbar } = useSnackbar();
    const [expanded, setExpanded] = useState(false);

    const [title, setTitle] = useState(message);

    const handleExpandClick = useCallback(() => {
        setExpanded((oldExpanded) => !oldExpanded);
    }, []);

    const handleDismiss = useCallback(() => {
        closeSnackbar(id);
    }, [id, closeSnackbar]);

    const name = typeof title !== 'object' ? `${title}` : 'Something wrong';
    const description = typeof detail !== 'object' ? `${detail}` : 'Something wrong';

    const [copied, handleCopy] = useCopyText(`${name}\n\n${description}`, { enqueueSuccessMessage: false });

    const comments = [
        name,
        '',
        '## Description',
        description,
        '## Extra Information',
        `- Version: ${envs.shared.VERSION}`,
        `- Environment: ${envs.shared.NODE_ENV}`,
        `- Commit Hash: ${envs.shared.COMMIT_HASH}`,
        `- UserAgent: ${navigator.userAgent}`,
        `- Timestamp: ${new Date().toISOString()}`,
    ].join('\n');

    const errorToReport = useMemo(() => {
        if (noReport) return null;
        const err = new Error(name);
        err.stack = comments;
        return err;
    }, [noReport, name, comments]);

    useReportErrorOnce(errorToReport, {
        exceptionId: ExceptionId.SNACKBAR_ERROR,
        tags: { handler: 'ErrorReportSnackbar.tsx' },
    });

    return (
        <div ref={ref} className="rounded-[4px] bg-danger">
            <div className="w-full text-sm">
                <div className="p-2 pl-3">
                    <div className="flex max-w-[400px] text-white">
                        <div className="mr-auto flex grow cursor-pointer items-center" onClick={handleExpandClick}>
                            <div className="mr-1 inline-block p-2 text-white">
                                {icon ?? <XCircleIcon className="size-[20px] text-white" />}
                            </div>
                            <div
                                className="break-word"
                                ref={(node) => {
                                    // convert jsx to string is too complicated, but in favor of DOM api, it's simple
                                    if (typeof message !== 'object' || !node) return;
                                    setTitle(node.innerText.replaceAll('\n', ' '));
                                }}
                            >
                                {message}
                            </div>
                        </div>
                        <CloseButton className="ml-4 p-2" size={16} onClick={handleDismiss} />
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
                                aria-label={copied ? 'Copied' : 'Copy error details'}
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
