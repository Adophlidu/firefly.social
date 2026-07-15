'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo, type ReactNode } from 'react';

import type { DirectMessageItem } from '@/components/DirectMessages/types.js';

interface MessageBubbleShellProps {
    item: DirectMessageItem;
    isGroupedWithPrevious: boolean;
    showTimestamp: boolean;
    onRetry: () => void;
    children: ReactNode;
}

// Layout and metadata shared by every message type: alignment, width, and the timestamp/send-status
// footer. The per-type content is rendered as children, so a new message type never touches this.
export const MessageBubbleShell = memo(function MessageBubbleShell({
    item,
    isGroupedWithPrevious,
    showTimestamp,
    onRetry,
    children,
}: MessageBubbleShellProps) {
    const sendStatus = item.kind === 'text' || item.kind === 'media' ? item.status : undefined;
    const isFailed = sendStatus === 'failed';
    const shouldShowMetadata = showTimestamp || sendStatus === 'pending' || isFailed;

    return (
        <div
            className={classNames('flex w-full min-w-0', {
                'justify-end': item.isSelf,
                'justify-start': !item.isSelf,
                'mt-1': isGroupedWithPrevious,
                'mt-4': !isGroupedWithPrevious,
            })}
        >
            <div
                className={classNames('flex min-w-0 max-w-[82%] flex-col md:max-w-[72%]', {
                    'items-end': item.isSelf,
                })}
            >
                {children}
                {shouldShowMetadata ? (
                    <div
                        className={classNames('mt-1 flex items-center gap-2 px-1 text-[10px] text-second', {
                            'justify-end': item.isSelf,
                        })}
                    >
                        {showTimestamp ? <span>{item.timestamp}</span> : null}
                        {item.isSelf && sendStatus === 'pending' ? (
                            <span>
                                <Trans>Sending</Trans>
                            </span>
                        ) : null}
                        {isFailed ? (
                            <>
                                <span className="font-semibold text-red-500">
                                    <Trans>Not sent</Trans>
                                </span>
                                <button
                                    type="button"
                                    className="font-bold text-fireflyBrand hover:underline"
                                    onClick={onRetry}
                                >
                                    <Trans>Retry</Trans>
                                </button>
                            </>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    );
});
