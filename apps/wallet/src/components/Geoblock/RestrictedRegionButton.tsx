import { Trans } from '@lingui/react/macro';
import { memo, type ReactNode } from 'react';

import { Button, type ButtonProps } from '@/components/ui/button.js';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.js';

interface RestrictedRegionButtonProps {
    className?: string;
    variant?: ButtonProps['variant'];
    size?: ButtonProps['size'];
}

export const RestrictedRegionButton = memo(function RestrictedRegionButton({
    className,
    variant = 'primary',
    size = 'lg',
}: RestrictedRegionButtonProps) {
    const label: ReactNode = <Trans>Restricted Region</Trans>;
    const tooltip: ReactNode = <Trans>This feature is currently unavailable in your region.</Trans>;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant={variant} size={size} className={className} disabled>
                    {label}
                </Button>
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
    );
});
