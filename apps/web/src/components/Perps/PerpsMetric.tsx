'use client';

import { classNames } from '@dimensiondev/utils';
import { memo, type ReactNode, useState } from 'react';

interface Props {
    label: ReactNode;
    value: ReactNode;
    valueClassName?: string;
    description?: ReactNode;
    helpLabel?: string;
}

export const PerpsMetric = memo(function PerpsMetric({ label, value, valueClassName, description, helpLabel }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div
            data-testid="perps-market-metric"
            className="relative flex shrink-0 flex-col items-start justify-center px-2 py-1"
        >
            {description ? (
                <button
                    type="button"
                    aria-label={helpLabel}
                    aria-expanded={isOpen}
                    className="whitespace-nowrap text-xs leading-[14px] text-[#b1b1b1] outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[#4c4aa9]"
                    onClick={() => setIsOpen((value) => !value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Escape') setIsOpen(false);
                    }}
                >
                    {label}
                </button>
            ) : (
                <span className="whitespace-nowrap text-xs leading-[14px] text-[#b1b1b1]">{label}</span>
            )}
            <span
                data-testid="perps-market-metric-value"
                className={classNames(
                    'block whitespace-nowrap text-sm font-semibold tabular-nums leading-5',
                    valueClassName ?? 'text-lightTextMain',
                )}
            >
                {value}
            </span>
            {isOpen ? (
                <span
                    role="tooltip"
                    className="absolute left-2 top-12 z-40 w-64 rounded-lg bg-lightTextMain p-3 text-xs leading-5 text-white shadow-lg"
                >
                    {description}
                </span>
            ) : null}
        </div>
    );
});
