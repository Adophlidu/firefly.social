'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import type { HTMLProps, ReactNode } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import {
    type SearchPredictionEventStatus,
    useSearchPredictionEventStatus,
} from '@/store/useSearchPredictionFilterStore.js';

export const SEARCH_PREDICTION_EVENT_STATUS_OPTIONS: Array<{
    value: SearchPredictionEventStatus;
    label: ReactNode;
}> = [
    {
        value: 'active',
        label: <Trans>Active</Trans>,
    },
    {
        value: 'resolved',
        label: <Trans>Resolved</Trans>,
    },
];

export function SearchPredictionEventStatusTabs({ className, ...props }: HTMLProps<HTMLDivElement>) {
    const [selectedStatus, setEventStatus] = useSearchPredictionEventStatus();

    return (
        <nav {...props} className={classNames('no-scrollbar flex gap-x-2 overflow-x-auto px-4 pb-2 pt-3', className)}>
            {SEARCH_PREDICTION_EVENT_STATUS_OPTIONS.map((option) => {
                const selected = selectedStatus === option.value;

                return (
                    <ClickableButton
                        key={option.value}
                        className={classNames(
                            'flex h-8 shrink-0 items-center justify-center rounded-md px-3 text-base leading-8 transition-colors',
                            selected ? 'bg-highlight text-white' : 'bg-thirdMain text-second hover:text-highlight',
                        )}
                        aria-pressed={selected}
                        onClick={() => void setEventStatus(option.value)}
                    >
                        {option.label}
                    </ClickableButton>
                );
            })}
        </nav>
    );
}
