'use client';

import VoteIcon from '@dimensiondev/assets/vote.svg';
import { Trans } from '@lingui/react/macro';
import type { PropsWithChildren } from 'react';

import { ActivityCellAction } from '@/components/ActivityCell/ActivityCellAction.js';
import { ActivityCellActionTag } from '@/components/ActivityCell/ActivityCellActionTag.js';

export function ActivityCellSnapshotAction({ children }: PropsWithChildren) {
    return (
        <ActivityCellAction>
            <ActivityCellActionTag icon={<VoteIcon />}>
                <Trans>Voted</Trans>
            </ActivityCellActionTag>
            {children}
        </ActivityCellAction>
    );
}
