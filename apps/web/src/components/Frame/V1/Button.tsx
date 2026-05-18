import LinkIcon from '@dimensiondev/assets/link-square.svg';
import { ActionType } from '@dimensiondev/enums';
import { useDetectOverflow } from '@dimensiondev/hooks';
import { classNames } from '@dimensiondev/utils';

import { ClickableButton } from '@/components/ClickableButton.js';
import type { FrameButton } from '@/types/frame.js';

interface Props {
    button: FrameButton;
    disabled?: boolean;
    onClick?: () => void;
}

export function Button({ button, disabled = false, onClick }: Props) {
    const [overflow, ref] = useDetectOverflow();
    return (
        <ClickableButton
            className={classNames(
                'border-line text-main dark:bg-darkBottom box-border flex flex-1 items-center justify-center overflow-auto rounded-md border bg-white p-2 dark:text-white',
                {
                    'hover:bg-bg hover:cursor-pointer': !disabled,
                },
            )}
            disabled={disabled}
            key={button.index}
            onClick={() => {
                if (!disabled) onClick?.();
            }}
            title={overflow ? button.text : undefined}
            aria-label={button.text}
        >
            <span className="truncate" ref={ref}>
                {button.text}
            </span>
            {[ActionType.PostRedirect, ActionType.Link].includes(button.action) ? (
                <LinkIcon className="text-second ml-1 shrink-0" width={18} height={18} />
            ) : null}
        </ClickableButton>
    );
}
