'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

interface ChartLabelsProps {
    isSingleMarket: boolean;
    labels: Array<{
        id: string;
        label: string;
        color: string;
        value?: string;
        isResolved?: boolean; // final outcome
    }>;
}

export const ChartLabels = memo<ChartLabelsProps>(function ChartLabels({ labels, isSingleMarket }) {
    return (
        <div className="mb-6 flex flex-wrap gap-2">
            {labels.map((label) => {
                return (
                    <button key={label.id} className="flex shrink-0 items-center gap-2">
                        <span
                            className="size-2"
                            style={{
                                backgroundColor: label.color,
                            }}
                        />
                        <span
                            className={classNames(
                                'text-main',
                                isSingleMarket ? 'text-base' : 'text-xs',
                                isSingleMarket && label.isResolved ? 'font-bold' : '',
                            )}
                        >
                            {label.label}
                            {label.isResolved ? (
                                <>
                                    {' '}
                                    <Trans>Final Outcome</Trans>
                                </>
                            ) : label.value ? (
                                ` ${label.value}`
                            ) : (
                                ''
                            )}
                        </span>
                    </button>
                );
            })}
        </div>
    );
});
