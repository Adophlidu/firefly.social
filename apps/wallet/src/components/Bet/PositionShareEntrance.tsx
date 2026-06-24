import ShareIcon from '@dimensiondev/assets/share-solid.svg';
import type { HTMLProps } from 'react';

import { cn } from '@/lib/utils.js';

interface PositionShareEntranceProps extends HTMLProps<HTMLButtonElement> {
    onClick?: () => void;
}

export function PositionShareEntrance({ className, onClick, ...rest }: PositionShareEntranceProps) {
    return (
        <button
            className={cn('flex size-7 items-center justify-center rounded-full hover:bg-link/[0.2]', className)}
            {...rest}
            type="button"
            onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onClick?.();
            }}
        >
            <ShareIcon width={16} height={16} className="text-[#8E96FF]" />
        </button>
    );
}
