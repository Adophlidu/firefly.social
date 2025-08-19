import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { first, uniq } from 'lodash-es';
import { memo, useCallback } from 'react';
import { useAsyncFn } from 'react-use';

import Close from '@/assets/close.svg';
import Info from '@/assets/info.svg';
import Trash from '@/assets/trash2.svg';
import { SchedulePostSettings } from '@/components/Compose/SchedulePostSettings.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { NoResultsFallback } from '@/components/NoResultsFallback.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { Tooltip } from '@/components/Tooltip.js';
import { VirtualList } from '@/components/VirtualList/VirtualList.js';
import { VirtualListFooter } from '@/components/VirtualList/VirtualListFooter.js';
import { queryClient } from '@/configs/queryClient.js';
import { ScheduleTaskStatus, ScrollListKey } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { enqueueMessageFromError } from '@/helpers/enqueueMessage.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal.js';
import { DraggablePopoverRef } from '@/modals/DraggablePopover.js';
import { SchedulePostModalRef } from '@/modals/SchedulePostModal.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { captureComposeSchedulePostEvent } from '@/providers/telemetry/captureComposeEvent.js';
import { PostMediaType, type SchedulePostDisplayInfo, type ScheduleTask } from '@/providers/types/Firefly.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { deleteScheduledPost, getScheduledPosts } from '@/services/post.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';
import { usePreferencesState } from '@/store/usePreferenceStore.js';

function getTitle(displayInfo: SchedulePostDisplayInfo, isFailed: boolean) {
    if (!displayInfo) return;
    switch (displayInfo.type) {
        case 'compose':
            return isFailed ? <Trans>FAILED POST</Trans> : <Trans>POST</Trans>;
        case 'reply':
            return <Trans>REPLY</Trans>;
        case 'quote':
            return <Trans>QUOTE</Trans>;
        default:
            safeUnreachable(displayInfo.type);
            return;
    }
}

const ScheduleTaskItem = memo(function ScheduleTaskItem({ task }: { task: ScheduleTask }) {
    const { updateIsFailedSchedulePost } = useComposeStateStore();
    const { history } = useRouter();
    const isFailed = task.relation.some((x) => x.status === ScheduleTaskStatus.Failed);

    const isMedium = useIsMedium();

    const content = first(task.relation)?.content;
    const createdAt = first(task.relation)?.updated_at;
    const mediaTypes = first(task.relation)
        ?.media_type?.map((x) => {
            if (x === PostMediaType.Text) return;
            return `[${x}]`;
        })
        .filter(Boolean)
        .join('');

    const [{ loading: removeLoading }, handleRemove] = useAsyncFn(async () => {
        try {
            if (!task.task_uuid) return;

            const confirmed = await ConfirmModalRef.openAndWaitForClose({
                title: <Trans>Delete</Trans>,
                content: (
                    <div className="text-fourMain">
                        <Trans>This can’t be undone, and the scheduled send will be canceled.</Trans>
                    </div>
                ),
                confirmButtonText: <Trans>Confirm</Trans>,
                enableCancelButton: true,
            });
            if (!confirmed) return;

            const result = await deleteScheduledPost(task.task_uuid);
            if (!result) return;

            queryClient.refetchQueries({
                queryKey: ['schedule-tasks', fireflySessionHolder.session?.profileId],
            });

            captureComposeSchedulePostEvent(EventId.COMPOSE_SCHEDULED_POST_DELETE_SUCCESS, null, {
                scheduleId: task.task_uuid,
            });
        } catch (error) {
            enqueueMessageFromError(error, t`Failed to delete scheduled post.`);
            throw error;
        }
    }, [task.task_uuid]);

    return (
        <div className="border-b border-line p-3">
            <div
                className={classNames('flex items-center', {
                    'justify-end': !isFailed,
                    'justify-between': isFailed,
                })}
            >
                {isFailed ? (
                    <div className="text-[12px] font-bold text-danger">
                        <Trans>FAILED POST</Trans>
                    </div>
                ) : null}
                {removeLoading ? (
                    <LoadingIcon size={20} className="cursor-pointer text-secondary" />
                ) : (
                    <Tooltip content={<Trans>Delete</Trans>}>
                        <Trash className="size-5 cursor-pointer text-secondary" onClick={handleRemove} />
                    </Tooltip>
                )}
            </div>
            <div
                className="my-2 cursor-pointer text-fourMain"
                onClick={() => {
                    if (isFailed) {
                        updateIsFailedSchedulePost(true);
                        history.push('/');
                        return;
                    }
                    if (isMedium) {
                        SchedulePostModalRef.open({
                            action: 'update',
                            task,
                        });
                    } else {
                        DraggablePopoverRef.open({
                            content: (
                                <SchedulePostSettings
                                    action="update"
                                    task={task}
                                    onClose={() => DraggablePopoverRef.close()}
                                />
                            ),
                            enableOverflow: false,
                        });
                    }
                }}
            >
                <div className="line-clamp-5 min-h-[24px] break-words text-left text-medium leading-[24px]">
                    {content}
                    {mediaTypes?.length ? (
                        <span>
                            <br /> {mediaTypes}
                        </span>
                    ) : null}
                </div>
            </div>
            <div className="flex gap-x-1">
                <span className="flex items-center gap-x-1 font-bold">
                    {uniq(task.relation.map((x) => x.platform)).map((platform, index) => (
                        <SocialSourceIcon key={index} source={resolveSocialSource(platform)} size={20} />
                    ))}
                </span>
                <span className="text-[13px] font-medium leading-[24px] text-secondary">
                    {isFailed ? (
                        <Trans>
                            Saved on {dayjs(createdAt).format('ddd, MMM DD, YYYY')} at{' '}
                            {dayjs(createdAt).format('hh:mm A')}
                        </Trans>
                    ) : (
                        <Trans>
                            will send on {dayjs(task.schedule_at).format('ddd, MMM DD, YYYY')} at{' '}
                            {dayjs(task.schedule_at).format('hh:mm A')}
                        </Trans>
                    )}
                </span>
            </div>
        </div>
    );
});

function getScheduleTaskItemContent(task: ScheduleTask) {
    return <ScheduleTaskItem key={task.task_uuid} task={task} />;
}

export function ScheduleTaskList() {
    const isLogin = useIsLoginFirefly();

    const { data, fetchNextPage, isFetching, isFetchingNextPage, hasNextPage } = useSuspenseInfiniteQuery({
        queryKey: ['schedule-tasks', fireflySessionHolder.session?.profileId],
        queryFn: async ({ pageParam }) => {
            try {
                if (!isLogin) return createPageable([], createIndicator());

                return await getScheduledPosts(createIndicator(undefined, pageParam), [
                    ScheduleTaskStatus.Pending,
                    ScheduleTaskStatus.Failed,
                    ScheduleTaskStatus.Success,
                ]);
            } catch {
                return createPageable([], createIndicator());
            }
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextIndicator?.id,
        refetchOnMount: true,
        select: (data) => data.pages.flatMap((x) => x.data),
    });

    const onEndReached = useCallback(async () => {
        if (!hasNextPage || isFetching || isFetchingNextPage) {
            return;
        }
        await fetchNextPage();
    }, [fetchNextPage, hasNextPage, isFetching, isFetchingNextPage]);

    const { preferences, setPreference } = usePreferencesState();

    if (!data?.length) {
        return <NoResultsFallback className="h-[478px] justify-center" />;
    }

    return (
        <div className="no-scrollbar box-border flex min-h-[478px] flex-grow flex-col gap-1 overflow-auto p-3">
            {preferences.SHOW_SCHEDULE_POST_TIP ? (
                <div className="flex items-center gap-1.5 rounded-[4px] bg-bg p-3">
                    <Info width={20} height={20} className="shrink-0 text-main" />
                    <div className="text-left text-xs leading-4 text-main">
                        <Trans>
                            Turning off multi-device login will cause scheduled posts to fail. To ensure that posts
                            <br /> are sent as scheduled, please make sure that multi-device login remains turned on.
                        </Trans>
                    </div>
                    <Close
                        width={20}
                        height={20}
                        className="shrink-0 cursor-pointer text-main"
                        onClick={() => {
                            setPreference('SHOW_SCHEDULE_POST_TIP', false);
                        }}
                    />
                </div>
            ) : null}
            <VirtualList
                data={data}
                endReached={onEndReached}
                components={{
                    Footer: VirtualListFooter,
                }}
                className="no-scrollbar schedule-task-list box-border h-full min-h-0 flex-1"
                listKey={`$${ScrollListKey.SchedulePosts}`}
                computeItemKey={(index, item) => item.task_uuid}
                itemContent={(index, task) => getScheduleTaskItemContent(task)}
            />
        </div>
    );
}
