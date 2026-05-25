'use client';

import PollIcon from '@dimensiondev/assets/poll.svg';
import { SORTED_POLL_SOURCES } from '@dimensiondev/constants/computed';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Tooltip } from '@/components/Tooltip.js';
import { resolveSourcesName } from '@/helpers/resolveSourceName.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';

export const PollButton = memo(function PollButton() {
    const { videos, images, poll, availableSources, rpPayload } = useCompositePost();
    const { createPoll } = useComposeStateStore();

    const invalidSources = availableSources.filter((x) => !SORTED_POLL_SOURCES.includes(x));
    const isPollSupported = availableSources.length > 0 && invalidSources.length === 0;
    const hasConflictContent = videos.length > 0 || images.length > 0 || !!poll || !!rpPayload;
    const disabled = !isPollSupported || hasConflictContent;

    return (
        <Tooltip
            content={
                !isPollSupported && invalidSources.length > 0 ? (
                    <Trans>
                        Polls are only available on {resolveSourcesName(SORTED_POLL_SOURCES, undefined, true)}
                    </Trans>
                ) : (
                    <Trans>Poll</Trans>
                )
            }
            placement="top"
            disabled={!isPollSupported ? false : hasConflictContent}
        >
            <ClickableButton
                className={classNames('leading-4 text-main', disabled ? 'cursor-not-allowed opacity-50' : '')}
                onClick={() => {
                    if (disabled) return;
                    createPoll();
                }}
                aria-label="Create poll"
            >
                <PollIcon width={24} height={24} />
            </ClickableButton>
        </Tooltip>
    );
});
