import { classNames } from '@dimensiondev/utils';
import { memo } from 'react';

import SelectedIcon from '@/assets/selected.svg';
import { ClickableArea } from '@/components/ClickableArea.js';

interface SnapshotChoiceProps {
    selected?: boolean;
    value: string;
    onClick: (value: string) => void;
    disabled?: boolean;
}

export const SnapshotChoice = memo<SnapshotChoiceProps>(function SnapshotChoice({
    selected = false,
    disabled = false,
    value,
    onClick,
}) {
    return (
        <ClickableArea
            className={classNames(
                'flex w-full cursor-pointer items-center justify-between rounded-[10px] border bg-white px-5 py-2.5',
                {
                    'hover:border-lightHighlight hover:text-lightHighlight': !disabled,
                    'border-transparent text-commonMain': !selected,
                    'border border-lightHighlight !py-[7px] text-lightHighlight': selected,
                    'cursor-default opacity-40': disabled,
                },
            )}
            onClick={() => {
                if (disabled) return;
                onClick(value);
            }}
        >
            <span className="flex-1 truncate text-left text-sm font-bold leading-[18px]">{value}</span>
            {selected ? <SelectedIcon width={24} height={24} className="ml-2 shrink-0" /> : null}
        </ClickableArea>
    );
});
