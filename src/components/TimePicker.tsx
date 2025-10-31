'use client';

import { classNames } from '@dimensiondev/utils';
import { memo, useRef } from 'react';
import { useMount } from 'react-use';

export interface TimePickerProps {
    open: boolean;
    onToggle: (x: boolean) => void;
    value: Date;
    onChange: (time: Date) => void;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
}

interface TimeColumnProps {
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    className?: string;
}

const TimeColumn = memo(function TimeColumn({ value, onChange, min, max, className }: TimeColumnProps) {
    const numbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedItemRef = useRef<HTMLDivElement>(null);

    useMount(() => {
        if (containerRef.current && selectedItemRef.current) {
            const container = containerRef.current;
            const selectedItem = selectedItemRef.current;

            const containerHeight = container.clientHeight;
            const itemHeight = selectedItem.clientHeight;
            const selectedItemTop = selectedItem.offsetTop;
            const scrollTop = selectedItemTop - containerHeight / 2 + itemHeight / 2;

            container.scrollTo({
                top: scrollTop,
                behavior: 'smooth',
            });
        }
    });

    return (
        <div
            ref={containerRef}
            className={classNames(
                'no-scrollbar flex h-32 touch-pan-y flex-col overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]',
                className,
            )}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
        >
            {numbers.map((num) => (
                <div
                    key={num}
                    ref={num === value ? selectedItemRef : null}
                    className={classNames(
                        'flex h-8 w-12 cursor-pointer items-center justify-center text-sm transition-all duration-200',
                        {
                            'rounded bg-lightHighlight text-white': num === value,
                            'text-second': num !== value,
                        },
                    )}
                    onClick={() => onChange(num)}
                >
                    {num.toString().padStart(2, '0')}
                </div>
            ))}
        </div>
    );
});

export const TimePicker = memo(function TimePicker({ value, onChange, open, onToggle }: TimePickerProps) {
    const handleTimeChange = (date: Date) => {
        onChange(date);
        onToggle(false);
    };

    if (!open) return null;
    return (
        <div className="absolute right-[15px] top-12 z-50 flex flex-col gap-[6px] rounded-2xl border border-line bg-bgModal px-1 pt-2">
            <div className="flex items-center justify-center gap-4 p-1">
                <TimeColumn
                    value={value.getHours()}
                    onChange={(hours: number) => {
                        const result = new Date(value);
                        result.setHours(hours);
                        handleTimeChange(result);
                    }}
                    min={0}
                    max={23}
                />
                <div className="h-32 w-px bg-line" />
                <TimeColumn
                    value={value.getMinutes()}
                    onChange={(minutes: number) => {
                        const result = new Date(value);
                        result.setMinutes(minutes);
                        handleTimeChange(result);
                    }}
                    min={0}
                    max={59}
                />
            </div>
        </div>
    );
});
