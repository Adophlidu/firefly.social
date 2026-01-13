import { classNames } from '@dimensiondev/utils';
import { memo } from 'react';

import MinusIcon from '@/assets/snapshot/minus.svg';
import PlusIcon from '@/assets/snapshot/plus.svg';
import { ClickableArea } from '@/components/ClickableArea.js';

interface SnapshotQuadraticChoiceProps {
    label: string;
    quantity: number;
    disabled?: boolean;
    onChange: (quantity: number) => void;
    total: number;
}

export const SnapshotQuadraticChoice = memo<SnapshotQuadraticChoiceProps>(function SnapshotQuadraticChoice({
    label,
    quantity,
    disabled = false,
    total,
    onChange,
}) {
    const percentage = total ? (quantity / total) * 100 : 0;

    return (
        <ClickableArea
            className={classNames(
                'flex w-full cursor-pointer items-center justify-between rounded-[10px] border bg-white px-5 py-2',
                {
                    'hover:border-lightHighlight': !disabled,
                    'border-transparent text-commonMain': !quantity,
                    'border border-lightHighlight text-lightHighlight': !!quantity,
                    'cursor-default opacity-40': disabled,
                },
            )}
        >
            <span className="flex-1 truncate pr-2 text-sm font-bold leading-[18px]">{label}</span>

            <div className="flex shrink-0 items-center gap-[6px]">
                <div
                    className={classNames('flex min-w-[100px] items-center justify-between rounded-full', {
                        'bg-bg03': !quantity,
                        'bg-lightHighlight bg-opacity-20': !!quantity,
                    })}
                >
                    <div
                        className={classNames('flex size-6 items-center justify-center rounded-full', {
                            'bg-[#acacae] opacity-40': !quantity,
                            'bg-lightHighlight bg-opacity-20': !!quantity,
                        })}
                        onClick={() => {
                            if (!quantity) return;
                            onChange(quantity - 1);
                        }}
                    >
                        <MinusIcon />
                    </div>
                    <span className="font-bold">{quantity}</span>
                    <div
                        className={classNames('flex size-6 items-center justify-center rounded-full', {
                            'bg-[#acacae]': !quantity,
                            'bg-lightHighlight bg-opacity-20': !!quantity,
                        })}
                        onClick={() => {
                            onChange(quantity + 1);
                        }}
                    >
                        <PlusIcon />
                    </div>
                </div>
                <div className="w-10 text-right text-sm font-bold leading-[18px]">{Math.round(percentage)}%</div>
            </div>
        </ClickableArea>
    );
});
