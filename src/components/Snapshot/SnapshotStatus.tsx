import { Trans } from '@lingui/react/macro';
import { safeUnreachable } from '@masknet/kit';
import { useMemo } from 'react';

import ActiveIcon from '@/assets/snapshot-active.svg';
import ClosedIcon from '@/assets/snapshot-closed.svg';
import RejectedIcon from '@/assets/snapshot-rejected.svg';
import { SnapshotState } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';

interface Props {
    status: SnapshotState;
    className?: string;
}

export function SnapshotStatus({ status, className }: Props) {
    const isActiveOrPending = status === SnapshotState.Active || status === SnapshotState.Pending;

    const title = useMemo(() => {
        switch (status) {
            case SnapshotState.Active:
                return <Trans>Active</Trans>;
            case SnapshotState.Pending:
                return <Trans>Pending</Trans>;
            case SnapshotState.Passed:
                return <Trans>Passed</Trans>;
            case SnapshotState.Rejected:
                return <Trans>Rejected</Trans>;
            case SnapshotState.Executed:
                return <Trans>Executed</Trans>;
            case SnapshotState.Closed:
                return <Trans>Closed</Trans>;
            default:
                safeUnreachable(status);
                return null;
        }
    }, [status]);
    return (
        <div
            className={classNames(
                'flex items-center gap-1 rounded-full bg-secondary px-3 py-[2px] text-sm leading-[18px] text-white',
                {
                    '!bg-highlight': isActiveOrPending,
                    '!bg-danger !bg-opacity-50': status === SnapshotState.Rejected,
                    '!opacity-50': status === SnapshotState.Pending,
                },
                className,
            )}
        >
            {isActiveOrPending ? <ActiveIcon /> : status === SnapshotState.Rejected ? <RejectedIcon /> : <ClosedIcon />}
            <span>{title}</span>
        </div>
    );
}
