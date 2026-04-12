'use client';

import SendIcon from '@dimensiondev/assets/send.svg';
import Send2Icon from '@dimensiondev/assets/send2.svg';
import { classNames, delay } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { ConnectorNotConnectedError } from '@wagmi/core';
import { compact, values } from 'lodash-es';
import { type HTMLProps, useMemo, useState } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { AddThread } from '@/components/Compose/ComposeActions/AddThread.js';
import { InteractiveTippy } from '@/components/InteractiveTippy.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { queryClient } from '@/configs/queryClient.js';
import { isValidPost } from '@/helpers/isValidPost.js';
import { resolveSocialSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useAbortController } from '@/hooks/useAbortController.js';
import { useCheckPostMedias } from '@/hooks/useCheckPostMedias.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { logger } from '@/libs/Logger.js';
import { ComposeModalRef } from '@/modals/ComposeModal/refs.js';
import { deleteCloudDraft } from '@/providers/firefly/cloud-draft/deleteCloudDraft.js';
import { createAnonymousPost } from '@/services/createAnonymousPost.js';
import { crossPost } from '@/services/crossPost.js';
import { crossPostThread } from '@/services/crossPostThread.js';
import { crossSchedulePost } from '@/services/crossSchedulePost.js';
import { crossPostScheduleThread } from '@/services/crossSchedulePostThread.js';
import { useComposeDraftState } from '@/store/useComposeDraftStore.js';
import { useComposeScheduleStateStore } from '@/store/useComposeScheduleStore.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';
import type { CompositePost } from '@/types/compose.js';

interface ComposeSendProps extends HTMLProps<HTMLDivElement> {}

export function ComposeSend(props: ComposeSendProps) {
    const controller = useAbortController();

    const post = useCompositePost();
    const { type, posts, currentDraftId } = useComposeStateStore();
    const { scheduleTime } = useComposeScheduleStateStore();
    const { removeDraft, removeTempDrafts } = useComposeDraftState();

    const isMedium = useIsMedium();

    const checkPostMedias = useCheckPostMedias();

    const [percentage, setPercentage] = useState(0);
    const hasMultiplePosts = posts.length > 1;
    const [{ loading }, handlePost] = useAsyncFn(
        async (isRetry = false) => {
            if (checkPostMedias()) return;

            try {
                controller.current.renew();

                let postResult: CompositePost | undefined = undefined;

                if (hasMultiplePosts) {
                    scheduleTime
                        ? await crossPostScheduleThread(scheduleTime, controller.current.signal)
                        : await crossPostThread({
                              isRetry,
                              progressCallback: setPercentage,
                              signal: controller.current.signal,
                          });
                } else {
                    if (post.isAnonymous) {
                        await createAnonymousPost(type, post, controller.current.signal);
                    } else {
                        scheduleTime
                            ? await crossSchedulePost(type, post, scheduleTime, controller.current.signal)
                            : (postResult = await crossPost(type, post, {
                                  isRetry,
                                  signal: controller.current.signal,
                              }));
                    }
                }
                await delay(300);
                // If the draft is applied and sent successfully, remove the draft.
                if (currentDraftId) {
                    removeDraft(currentDraftId);
                    deleteCloudDraft(currentDraftId, post.availableSources.map(resolveSocialSourceInUrl)).catch(
                        (error) => {
                            logger.error('Failed to delete cloud draft', { draftId: currentDraftId, error });
                        },
                    );
                    queryClient.invalidateQueries({ queryKey: ['cloud-drafts'] });
                }
                removeTempDrafts();
                ComposeModalRef.close({
                    post: postResult,
                });
            } catch (error) {
                if (error instanceof ConnectorNotConnectedError) return;
                throw error;
            }
        },
        [
            controller,
            hasMultiplePosts,
            currentDraftId,
            scheduleTime,
            type,
            post,
            checkPostMedias,
            removeDraft,
            removeTempDrafts,
        ],
    );

    const hasError = useMemo(() => {
        return posts.some((x) => !!compact(values(x.postError)).length);
    }, [posts]);

    const disabled = loading || (posts.length > 1 ? posts.some((x) => !isValidPost(x)) : !isValidPost(post));

    if (!isMedium) {
        return (
            <>
                {posts.length > 1 && loading ? (
                    <span
                        className="bg fixed left-0 top-0 z-50 h-1 w-full bg-black/50 duration-100 dark:bg-white/50"
                        style={{
                            transform: `scaleX(${percentage})`,
                            transformOrigin: 'left',
                        }}
                    />
                ) : null}
                <ClickableButton
                    className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                    disabled={disabled}
                    onClick={() => handlePost(!!hasError)}
                    aria-label={hasError ? 'Retry post' : 'Send post'}
                >
                    {loading ? (
                        <LoadingIcon size={24} className="text-main" />
                    ) : (
                        <Send2Icon
                            className={classNames('text-tabLine', {
                                'text-commonDanger': hasError,
                                'text-third': hasError,
                            })}
                            width={24}
                            height={24}
                        />
                    )}
                </ClickableButton>
            </>
        );
    }

    return (
        <div className="flex items-center justify-end gap-4">
            <AddThread />

            <InteractiveTippy
                className="tippy-card"
                placement="bottom"
                disabled={!hasError || posts.length === 1}
                content={
                    <div className="bg-tooltipBg flex flex-col rounded-lg px-3 py-1 opacity-80">
                        {post.availableSources.map((x) => {
                            const name = resolveSourceName(x);
                            const errorIndex = posts.findIndex((post) => post.postError[x]);

                            if (errorIndex === -1) return null;

                            return (
                                <div className="flex gap-x-1" key={x}>
                                    <span className="text-primaryBottom">{name}</span>
                                    <span className="text-commonDanger">
                                        {errorIndex} / {posts.length}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                }
            >
                <ClickableButton
                    disabled={disabled}
                    className={classNames(
                        'text-medium relative flex min-w-[100px] items-center justify-center gap-1 overflow-hidden rounded-full px-1 py-2 font-bold leading-[18px]',
                        hasError ? 'bg-commonDanger text-white' : 'bg-black text-white dark:bg-white dark:text-black',
                    )}
                    onClick={() => {
                        handlePost(!!hasError);
                    }}
                    aria-label={hasError ? 'Retry post' : scheduleTime ? 'Send on schedule' : 'Send post'}
                >
                    {posts.length > 1 && loading ? (
                        <span
                            className="absolute left-0 top-0 z-10 size-full bg-white/50 duration-100 dark:bg-black/50"
                            style={{
                                transform: `scaleX(${percentage})`,
                                transformOrigin: 'left',
                            }}
                        />
                    ) : null}
                    {loading ? (
                        <>
                            <LoadingIcon size={16} className="animate-spin" />
                            <span>
                                <Trans>Posting...</Trans>
                            </span>
                        </>
                    ) : hasError ? (
                        <>
                            <SendIcon width={18} height={18} className="mr-1" />
                            <span>
                                <Trans>Retry</Trans>
                            </span>
                        </>
                    ) : (
                        <>
                            <SendIcon width={18} height={18} className="text-primaryBottom mr-1" />
                            <span>{scheduleTime ? <Trans>Send on schedule</Trans> : <Trans>Send</Trans>}</span>
                        </>
                    )}
                </ClickableButton>
            </InteractiveTippy>
        </div>
    );
}
