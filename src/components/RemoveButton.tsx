import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';

import CloseIcon from '@/assets/close.svg';
import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { Tooltip } from '@/components/Tooltip.js';

interface RemoveButtonProps extends ClickableButtonProps {
    tooltip?: string;
    size?: number;
}

export function RemoveButton({ size = 18, tooltip, ref, ...props }: RemoveButtonProps) {
    return (
        <Tooltip content={tooltip ?? <Trans>Remove</Trans>} placement="top">
            <ClickableButton
                {...props}
                className={classNames(
                    props.className,
                    'inline-flex size-7 items-center justify-center rounded-full bg-gray-500 md:group-hover:inline-flex',
                )}
            >
                <CloseIcon
                    className={classNames('text-white', {
                        'cursor-pointer': !props.disabled,
                    })}
                    width={size}
                    height={size}
                />
            </ClickableButton>
        </Tooltip>
    );
}
