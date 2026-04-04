'use client';

import ActiveIcon from '@dimensiondev/assets/snapshot-active.svg';
import ClosedIcon from '@dimensiondev/assets/snapshot-closed.svg';
import RejectedIcon from '@dimensiondev/assets/snapshot-rejected.svg';
import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useMemo } from 'react';

import { SnapshotState } from '@/constants/enum.js';

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
                'bg-lightMain text-lightBottom flex items-center gap-1 rounded-full px-3 py-[2px] text-sm leading-[18px] opacity-40',
                {
                    '!bg-highlight !text-white !opacity-100': status === SnapshotState.Active,
                    '!bg-highlight !bg-opacity-50 !text-white !opacity-50': status === SnapshotState.Pending,
                    '!bg-danger !bg-opacity-50 !text-white': status === SnapshotState.Rejected,
                },
                className,
            )}
        >
            {isActiveOrPending ? <ActiveIcon /> : status === SnapshotState.Rejected ? <RejectedIcon /> : <ClosedIcon />}
            <span>{title}</span>
        </div>
    );
}
