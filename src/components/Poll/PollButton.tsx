import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import PollIcon from '@/assets/poll.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { Tooltip } from '@/components/Tooltip.js';
import { Source } from '@/constants/enum.js';
import { SORTED_POLL_SOURCES } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
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
                    invalidSources.includes(Source.Lens) ? (
                        <Trans>Poll for Lens will come back soon.</Trans>
                    ) : (
                        <Trans>Poll for ${resolveSourcesName(invalidSources)} is coming soon.</Trans>
                    )
                ) : (
                    <Trans>Poll</Trans>
                )
            }
            placement="top"
            disabled={!isPollSupported ? false : hasConflictContent}
        >
            <ClickableButton
                className={classNames('leading-4 text-main', disabled ? 'cursor-not-allowed opacity-50' : '')}
                disabled={disabled}
                onClick={() => createPoll()}
            >
                <PollIcon width={24} height={24} />
            </ClickableButton>
        </Tooltip>
    );
});
