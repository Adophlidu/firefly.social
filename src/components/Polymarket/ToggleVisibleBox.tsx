import { classNames } from '@firefly/utils';
import { memo, type PropsWithChildren, type ReactNode, useDeferredValue, useState } from 'react';

import ArrowDownIcon from '@/assets/arrow-line-down.svg';
import { ClickableButton } from '@/components/ClickableButton.js';

interface ToggleVisibleBoxProps {
    label: ReactNode;
    disabled?: boolean;
    contentClassName?: string;
}

export const ToggleVisibleBox = memo<PropsWithChildren<ToggleVisibleBoxProps>>(function ToggleVisibleBox({
    label,
    disabled = false,
    contentClassName,
    children,
}) {
    const [show, setShow] = useState(true);
    const deferredValue = useDeferredValue(show, true);

    return (
        <div>
            <div className="px-4 pt-3">
                <ClickableButton
                    className="flex items-center gap-1 text-main"
                    onClick={() => {
                        if (disabled) return;
                        setShow((prev) => !prev);
                    }}
                >
                    <span className="text-base font-bold">{label}</span>
                    <ArrowDownIcon
                        className={classNames('transition-transform', deferredValue ? 'rotate-180' : '')}
                        width={16}
                        height={16}
                    />
                </ClickableButton>
            </div>
            <div className={classNames('p-4', contentClassName, deferredValue ? '' : 'invisible h-0 overflow-hidden')}>
                {children}
            </div>
        </div>
    );
});
