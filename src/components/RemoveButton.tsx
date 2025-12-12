import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';

import { type ClickableButtonProps } from '@/components/ClickableButton.js';
import { CloseButton } from '@/components/IconButton.js';

interface RemoveButtonProps extends ClickableButtonProps {
    tooltip?: string;
    size?: number;
}

export function RemoveButton({ tooltip, ref, ...props }: RemoveButtonProps) {
    return (
        <CloseButton
            {...props}
            tooltip={tooltip ?? <Trans>Remove</Trans>}
            className={classNames(
                'inline-flex items-center justify-center !rounded-full bg-gray-500 hover:!bg-gray-500 md:group-hover:inline-flex',
                props.className,
            )}
        />
    );
}
