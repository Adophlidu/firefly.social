import { Trans } from '@lingui/react/macro';

import LeftArrowIcon from '@/assets/left-arrow.svg';
import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { Tooltip } from '@/components/Tooltip.js';
import { classNames } from '@/helpers/classNames.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';

interface BackButtonProps extends ClickableButtonProps {
    size?: number;
    tooltip?: React.ReactNode;
}

export function BackButton({ size = 24, tooltip = <Trans>Back</Trans>, ref, ...rest }: BackButtonProps) {
    const isMedium = useIsMedium();

    const button = (
        <ClickableButton {...rest} className={classNames('rounded hover:bg-lightBg', rest.className)}>
            <LeftArrowIcon
                className={classNames('text-main', {
                    'cursor-pointer': !rest.disabled,
                })}
                width={size}
                height={size}
            />
        </ClickableButton>
    );

    if (!isMedium) return button;

    return (
        <Tooltip content={tooltip} placement="top">
            {button}
        </Tooltip>
    );
}
