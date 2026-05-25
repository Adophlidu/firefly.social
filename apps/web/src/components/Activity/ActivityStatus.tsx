'use client';

import { ActivityStatus } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';

export function ActivityStatusTag({ status }: { status: ActivityStatus }) {
    switch (status) {
        case ActivityStatus.Ended:
            return (
                <div className="rounded-full border border-current bg-primaryBottom/80 px-2.5 text-center text-xs font-bold uppercase leading-6 text-second">
                    <Trans>Ended</Trans>
                </div>
            );
        case ActivityStatus.Active:
            return (
                <div className="flex items-center rounded-full border border-current bg-primaryBottom/80 px-2.5 text-center text-xs font-bold uppercase leading-6 text-success">
                    <Trans>Active</Trans>
                    <div className="ml-1 size-2 shrink-0 rounded-full bg-current" />
                </div>
            );
        case ActivityStatus.Upcoming:
            return (
                <div className="rounded-full border border-current bg-primaryBottom/80 px-2.5 text-center text-xs font-bold uppercase leading-6 text-main">
                    <Trans>Upcoming</Trans>
                </div>
            );
        default:
            safeUnreachable(status);
            return null;
    }
}
