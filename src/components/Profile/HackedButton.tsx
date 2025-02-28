import { memo } from 'react';

import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { classNames } from '@/helpers/classNames.js';

interface HackedButtonProps extends Omit<ClickableButtonProps, 'children'> {}

export const HackedButton = memo(function HackedButton({ className }: HackedButtonProps) {
    return (
        <ClickableButton
            className={classNames(
                'box-border flex h-8 min-w-[112px] cursor-default items-center justify-center whitespace-nowrap rounded-full border border-danger bg-danger px-5 text-medium font-semibold text-white outline-none transition-all',
                className,
            )}
        >
            Hacked
        </ClickableButton>
    );
});
