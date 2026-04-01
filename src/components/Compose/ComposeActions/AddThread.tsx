'use client';

import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import AddThreadIcon from '@/assets/add-thread.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { CountdownCircle } from '@/components/Compose/CountdownCircle.js';
import { Tooltip } from '@/components/Tooltip.js';
import { MAX_POST_SIZE_PER_THREAD } from '@/constants/static.js';
import { measureChars } from '@/helpers/chars.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useSetEditorContent } from '@/hooks/useSetEditorContent.js';
import { captureThreadClickEvent } from '@/providers/telemetry/captureClickEvent.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';

export const AddThread = memo(function AddThread() {
    const post = useCompositePost();
    const { type, posts, addPostInThread } = useComposeStateStore();

    const { usedLength, availableLength } = measureChars(post);

    const setEditorContent = useSetEditorContent();

    const hasThread = (post.images.length > 0 || usedLength) && type === 'compose' && !post.isAnonymous;

    return (
        <>
            {usedLength && post.availableSources.length ? (
                <div className="flex items-center gap-2.5 whitespace-nowrap text-medium text-main">
                    <CountdownCircle width={24} height={24} className="shrink-0" />
                    <span className={usedLength > availableLength ? 'text-danger' : ''}>
                        {usedLength} / {availableLength}
                    </span>
                </div>
            ) : null}

            {hasThread ? (
                <ClickableButton
                    className="text-main"
                    disabled={posts.length >= MAX_POST_SIZE_PER_THREAD}
                    onClick={() => {
                        addPostInThread();
                        setEditorContent('');
                        captureThreadClickEvent();
                    }}
                >
                    {posts.length >= MAX_POST_SIZE_PER_THREAD ? (
                        <AddThreadIcon width={24} height={24} className="text-highlight outline-none" />
                    ) : (
                        <Tooltip content={<Trans>Add</Trans>} placement="top">
                            <AddThreadIcon width={24} height={24} className="text-highlight outline-none" />
                        </Tooltip>
                    )}
                </ClickableButton>
            ) : null}
        </>
    );
});
