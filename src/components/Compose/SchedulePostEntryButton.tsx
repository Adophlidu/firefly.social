import { Trans } from '@lingui/react/macro';
import dayjs from 'dayjs';
import { forwardRef, type HTMLProps, useCallback } from 'react';

import ScheduleIcon from '@/assets/schedule.svg';
import { SchedulePostSettings } from '@/components/Compose/SchedulePostSettings.js';
import { Tooltip } from '@/components/Tooltip.js';
import { STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { ENABLED_SCHEDULE_POST_SOURCES } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { resolveSourcesName } from '@/helpers/resolveSourceName.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { DraggablePopoverRef, SchedulePostModalRef } from '@/modals/controls.js';
import { useComposeScheduleStateStore } from '@/store/useComposeScheduleStore.js';

interface SchedulePostEntryButtonProps extends HTMLProps<HTMLDivElement> {
    showText?: boolean;
    disabled?: boolean;
}

export const SchedulePostEntryButton = forwardRef<HTMLDivElement, SchedulePostEntryButtonProps>(
    function SchedulePostEntryButton({ className, showText, disabled = false }: SchedulePostEntryButtonProps, ref) {
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
        }, [scheduleTime, isMedium, scheduleDisabled]);

        if (env.external.NEXT_PUBLIC_SCHEDULE_POST !== STATUS.Enabled) return null;

        const content = showText ? (
            <div
                className={classNames(
                    'mb-3 flex items-center gap-[10px] text-[13px] text-second',
                    scheduleDisabled ? 'cursor-not-allowed opacity-50' : '',
                )}
                onClick={handleClick}
                ref={ref}
            >
                <ScheduleIcon className={classNames('cursor-pointer', className)} />
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
            <div className="flex items-center gap-[10px] text-[13px] text-second" ref={ref}>
                <ScheduleIcon
                    className={classNames(
                        scheduleDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
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
                    invalidSources.length ? (
                        <Trans>Schedule post for {resolveSourcesName(invalidSources)} is coming soon.</Trans>
                    ) : (
                        <Trans>Schedule</Trans>
                    )
                }
            >
                {content}
            </Tooltip>
        );
    },
);
