import type { PropsWithChildren } from 'react';

import FailedSquareIcon from '@/assets/failed-square.svg';
import TickSquareIcon from '@/assets/tick-square.svg';
import { useActivityConnections } from '@/components/Activity/hooks/useActivityConnections.js';

export function ActivityVerifyText({
    verified,
    children,
    hasFailedIcon = false,
}: PropsWithChildren<{ verified?: boolean; hasFailedIcon?: boolean }>) {
    const { data: activityConnections } = useActivityConnections();
    return (
        <div className="flex w-full justify-between space-x-2">
            {children}
            {verified ? (
                <TickSquareIcon className="h-6 w-6 shrink-0 text-success" />
            ) : hasFailedIcon && activityConnections ? (
                <FailedSquareIcon className="h-6 w-6 shrink-0 text-deactivate" />
            ) : null}
        </div>
    );
}
