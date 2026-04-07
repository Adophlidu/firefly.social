import { Minus, Plus } from 'lucide-react';
import type React from 'react';

import { Button } from '@/components/ui/button.js';
import { cn } from '@/lib/utils.js';

export function BetAmountStepper({
    className,
    value,
    onChange,
    onDecrease,
    onIncrease,
    decreaseDisabled,
    increaseDisabled,
    inputClassName,
    inputProps,
    buttonClassName,
    decreaseButtonClassName,
    increaseButtonClassName,
}: {
    className?: string;
    value: string;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    onDecrease: () => void;
    onIncrease: () => void;
    decreaseDisabled?: boolean;
    increaseDisabled?: boolean;
    inputClassName?: string;
    inputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'className'>;
    buttonClassName?: string;
    decreaseButtonClassName?: string;
    increaseButtonClassName?: string;
}) {
    return (
        <div className={cn('grid w-full grid-cols-[32px_1fr_32px] items-center gap-4 px-8', className)}>
            <Button
                variant="secondary"
                size="icon"
                className={cn('size-8', buttonClassName, decreaseButtonClassName)}
                onClick={onDecrease}
                disabled={decreaseDisabled}
            >
                <Minus />
            </Button>
            <div className="flex w-full flex-col items-center">
                <input
                    type="number"
                    inputMode="decimal"
                    {...inputProps}
                    autoComplete="off"
                    value={value}
                    onChange={onChange}
                    className={cn(
                        'ring-none w-full appearance-none border-none bg-transparent text-center text-[40px] font-bold tabular-nums leading-10 outline-none focus:ring-0',
                        inputClassName,
                    )}
                />
            </div>
            <Button
                variant="secondary"
                size="icon"
                className={cn('size-8', buttonClassName, increaseButtonClassName)}
                onClick={onIncrease}
                disabled={increaseDisabled}
            >
                <Plus />
            </Button>
        </div>
    );
}
