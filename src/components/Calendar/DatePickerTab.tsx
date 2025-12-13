import { classNames } from '@dimensiondev/utils';
import { eachDayOfInterval, endOfWeek, startOfWeek } from 'date-fns';
import { useMemo, useRef } from 'react';
import { useClickAway } from 'react-use';

import CalendarIcon from '@/assets/calendar.svg';
import { DatePicker, type DatePickerProps } from '@/components/Calendar/DatePicker.js';
import { useAvailableDates } from '@/components/Calendar/hooks/useAvailableDates.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { EventProvider } from '@/types/calendar.js';

interface DatePickerTabProps extends DatePickerProps {
    isNews: boolean;
}

export function DatePickerTab(props: DatePickerTabProps) {
    const { date, onChange, open, onToggle, isNews } = props;
    const days = useMemo(() => {
        return eachDayOfInterval({ start: startOfWeek(date), end: endOfWeek(date) });
    }, [date]);
    const clickAwayListenerRef = useRef<HTMLDivElement>(null);
    useClickAway(clickAwayListenerRef, () => onToggle(false));

    const { data: allowedDates = EMPTY_LIST } = useAvailableDates(
        isNews ? EventProvider.CoinCarp : EventProvider.Luma,
        date,
    );

    return (
        <div className="relative flex items-center justify-between border-x border-line p-3">
            {days.map((day) => {
                const localeDateString = day.toLocaleDateString();
                return (
                    <div
                        className={classNames(
                            'leading-20 flex size-[28px] cursor-pointer items-center justify-center rounded-full border border-secondary text-center text-sm text-secondary',
                            {
                                '!border-none bg-fireflyBrand text-white': date.getDate() === day.getDate(),
                                'cursor-default': allowedDates.includes(localeDateString),
                                '!cursor-not-allowed border-none opacity-50': !allowedDates.includes(localeDateString),
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
