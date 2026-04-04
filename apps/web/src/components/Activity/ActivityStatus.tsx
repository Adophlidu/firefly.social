'use client';

import { safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';

import { ActivityStatus } from '@/providers/types/Firefly.js';

export function ActivityStatusTag({ status }: { status: ActivityStatus }) {
    switch (status) {
        case ActivityStatus.Ended:
            return (
                <div className="bg-primaryBottom/80 text-second rounded-full border border-current px-2.5 text-center text-xs font-bold uppercase leading-6">
                    <Trans>Ended</Trans>
                </div>
            );
        case ActivityStatus.Active:
            return (
                <div className="bg-primaryBottom/80 text-success flex items-center rounded-full border border-current px-2.5 text-center text-xs font-bold uppercase leading-6">
                    <Trans>Active</Trans>
                    <div className="ml-1 size-2 shrink-0 rounded-full bg-current" />
                </div>
            );
        case ActivityStatus.Upcoming:
            return (
                <div className="bg-primaryBottom/80 text-main rounded-full border border-current px-2.5 text-center text-xs font-bold uppercase leading-6">
                    <Trans>Upcoming</Trans>
                </div>
            );
        default:
            safeUnreachable(status);
            return null;
    }
}
