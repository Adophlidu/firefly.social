import { Trans } from '@lingui/react/macro';
import dayjs from 'dayjs';
import { forwardRef, type HTMLProps, useCallback } from 'react';

import ScheduleIcon from '@/assets/schedule.svg';
import { SchedulePostSettings } from '@/components/Compose/SchedulePostSettings.js';
import { classNames } from '@/helpers/classNames.js';
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
        const { scheduleTime } = useComposeScheduleStateStore();

        const handleClick = useCallback(() => {
            if (disabled) return;

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
        }, [scheduleTime, isMedium, disabled]);

        if (showText) {
            return (
                <div
                    className={classNames(
                        'mb-3 flex items-center gap-[10px] text-[13px] text-second',
                        disabled ? 'cursor-not-allowed opacity-50' : '',
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
            );
        }

        return (
            <div className="flex items-center gap-[10px] text-[13px] text-second" ref={ref}>
                <ScheduleIcon
                    className={classNames(disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer', className)}
                    onClick={handleClick}
                />
            </div>
        );
    },
);
