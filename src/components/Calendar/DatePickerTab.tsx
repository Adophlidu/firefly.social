import { eachDayOfInterval, endOfWeek, startOfWeek } from 'date-fns';
import React, { useCallback, useMemo } from 'react';

import CalendarIcon from '@/assets/calendar.svg';
import { DatePicker, type DatePickerProps } from '@/components/Calendar/DatePicker.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { classNames } from '@/helpers/classNames.js';
import { useClickAwayListener } from '@/hooks/useClickAwayListener.js';

interface DatePickerTabProps extends DatePickerProps {}

export function DatePickerTab(props: DatePickerTabProps) {
    const { date, allowedDates, onChange, open, onToggle } = props;
    const days = useMemo(() => {
        return eachDayOfInterval({ start: startOfWeek(date), end: endOfWeek(date) });
    }, [date]);
    const clickAwayListenerRef = useClickAwayListener<HTMLDivElement>(useCallback(() => onToggle(false), [onToggle]));

    return (
        <div className="relative flex items-center justify-between border-x border-line p-3">
            {days.map((day) => {
                const localeDateString = day.toLocaleDateString();
                return (
                    <div
                        className={classNames(
                            'leading-20 flex h-[28px] w-[28px] cursor-pointer items-center justify-center rounded-full border border-secondary text-center text-sm text-secondary',
                            {
                                '!border-none bg-fireflyBrand text-white': date.getDate() === day.getDate(),
                                'cursor-default': allowedDates.includes(localeDateString),
                            },
                        )}
                        key={day.toString()}
                        onClick={() => {
                            if (!allowedDates.includes(localeDateString)) return;
                            onChange(day);
                        }}
                    >
                        <p>{day.getDate()}</p>
                    </div>
                );
            })}
            <div ref={clickAwayListenerRef} className="flex items-center justify-center">
                <ClickableButton
                    onClick={() => {
                        onToggle(!open);
                    }}
                >
                    <CalendarIcon className="cursor-pointer" width={24} height={24} />
                </ClickableButton>
                <DatePicker {...props} />
            </div>
        </div>
    );
}
