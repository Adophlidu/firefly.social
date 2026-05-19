'use client';

import ScheduleIcon from '@dimensiondev/assets/schedule.svg';
import { ENABLED_SCHEDULE_POST_SOURCES } from '@dimensiondev/constants/computed';
import { STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import dayjs from 'dayjs';
import { type HTMLProps, useCallback } from 'react';

import { SchedulePostSettings } from '@/components/Compose/SchedulePostSettings.js';
import { Tooltip } from '@/components/Tooltip.js';
import { resolveSourcesName } from '@/helpers/resolveSourceName.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { DraggablePopoverRef } from '@/modals/DraggablePopover/refs.js';
import { SchedulePostModalRef } from '@/modals/SchedulePostModal/refs.js';
import { captureSchedulePostClickEvent } from '@/providers/telemetry/captureClickEvent.js';
import { useComposeScheduleStateStore } from '@/store/useComposeScheduleStore.js';

interface SchedulePostEntryButtonProps extends HTMLProps<HTMLDivElement> {
    showText?: boolean;
    disabled?: boolean;
}

export function SchedulePostEntryButton({ className, showText, disabled = false, ref }: SchedulePostEntryButtonProps) {
    const isMedium = useIsMedium();
    const { availableSources } = useCompositePost();
    const { scheduleTime } = useComposeScheduleStateStore();

    const invalidSources = availableSources.filter((x) => !ENABLED_SCHEDULE_POST_SOURCES.includes(x));
    const scheduleDisabled = disabled || !!invalidSources.length || !availableSources.length;

    const handleClick = useCallback(() => {
        if (scheduleDisabled) return;

        const action = scheduleTime ? 'update' : 'create';

        if (isMedium) {
            SchedulePostModalRef.open({
                action,
            });
        } else {
            DraggablePopoverRef.open({
                content: <SchedulePostSettings action={action} onClose={() => DraggablePopoverRef.close()} />,
                enableOverflow: false,
            });
        }
        captureSchedulePostClickEvent();
    }, [scheduleTime, isMedium, scheduleDisabled]);

    if (envs.external.NEXT_PUBLIC_SCHEDULE_POST !== STATUS.Enabled) return null;

    const content = showText ? (
        <div
            className={classNames(
                'text-second mb-3 flex items-center gap-2.5 text-[13px]',
                scheduleDisabled ? 'cursor-not-allowed opacity-50' : '',
            )}
            onClick={handleClick}
            ref={ref}
        >
            <ScheduleIcon className={classNames('size-6 cursor-pointer', className)} />
            <span>
                <Trans>
                    Will send on{' '}
                    <span>
                        {dayjs(scheduleTime).format('ddd, MMM DD, YYYY')} at{' '}
                        <span>{dayjs(scheduleTime).format('hh:mm A')}</span>
                    </span>
                </Trans>
            </span>
        </div>
    ) : (
        <div className="text-second flex items-center gap-2.5 text-[13px]" ref={ref}>
            <ScheduleIcon
                className={classNames(
                    scheduleDisabled ? 'size-6 cursor-not-allowed opacity-50' : 'size-6 cursor-pointer',
                    className,
                )}
                onClick={handleClick}
            />
        </div>
    );

    return (
        <Tooltip
            placement="top"
            content={
                !scheduleDisabled ? (
                    <Trans>Schedule Post</Trans>
                ) : (
                    <Trans>
                        Scheduled posts are only available on{' '}
                        {resolveSourcesName(ENABLED_SCHEDULE_POST_SOURCES, undefined, true)}
                    </Trans>
                )
            }
        >
            {content}
        </Tooltip>
    );
}
