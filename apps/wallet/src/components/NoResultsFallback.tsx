import GhostHoleIcon from '@dimensiondev/assets/ghost.svg';
import { Trans } from '@lingui/react/macro';
import { type HTMLProps, type ReactNode } from 'react';

import { cn } from '@/lib/utils.js';

export interface NoResultsFallbackProps extends HTMLProps<HTMLDivElement> {
    message?: ReactNode;
    icon?: ReactNode;
}

export function NoResultsFallback({ icon, message, className, ...rest }: NoResultsFallbackProps) {
    return (
        <div className={cn('text-secondary flex flex-col items-center py-12', className)} {...rest}>
            {icon ?? <GhostHoleIcon width={200} height={143} className="text-third" />}
            <div className="text-medium mt-3 break-words text-center font-bold">
                {message ?? (
                    <div className="mt-10">
                        <Trans>There is no data available for display.</Trans>
                    </div>
                )}
            </div>
        </div>
    );
}
