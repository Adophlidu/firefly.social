'use client';

import { classNames } from '@dimensiondev/utils';
import { memo } from 'react';

import { formatLine } from '@/helpers/prediction/sportScoreUtils.js';

interface SportLineSelectorProps {
    lines: number[];
    selectedLine: number;
    onSelect: (line: number) => void;
}

export const SportLineSelector = memo(function SportLineSelector({
    lines,
    selectedLine,
    onSelect,
}: SportLineSelectorProps) {
    if (lines.length <= 1) return null;

    return (
        <div className="flex flex-wrap gap-1.5">
            {lines.map((line) => (
                <button
                    key={line}
                    type="button"
                    className={classNames(
                        'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                        line === selectedLine
                            ? 'bg-lightMain text-primaryBottom'
                            : 'bg-bg text-second hover:bg-lightBg',
                    )}
                    onClick={() => onSelect(line)}
                >
                    {formatLine(line)}
                </button>
            ))}
        </div>
    );
});
