'use client';

import { memo } from 'react';

interface ChartLabelsProps {
    labels: Array<{
        id: string;
        label: string;
        color: string;
        value?: string;
    }>;
}

export const ChartLabels = memo<ChartLabelsProps>(function ChartLabels({ labels }) {
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
                        <span className="text-xs text-main">
                            {label.label}
                            {label.value ? ` ${label.value}` : ''}
                        </span>
                    </button>
                );
            })}
        </div>
    );
});
