'use client';

import GhostHoleIcon from '@dimensiondev/assets/ghost.svg';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import type { HTMLProps, ReactNode } from 'react';

export interface NoResultsFallbackProps extends HTMLProps<HTMLDivElement> {
    message?: ReactNode;
    icon?: ReactNode;
}

export function NoResultsFallback({ icon, message, className, ...rest }: NoResultsFallbackProps) {
    return (
        <div className={classNames('flex flex-col items-center py-12 text-secondary', className)} {...rest}>
            {icon ?? <GhostHoleIcon width={200} height={143} className="text-third" />}
            <div className="mt-3 break-all text-center text-medium font-bold">
                {message ?? (
                    <p className="mt-10">
                        <Trans>There is no data available for display.</Trans>
                    </p>
                )}
            </div>
        </div>
    );
}
