'use client';

import { classNames } from '@dimensiondev/utils';

import { ACCENT_COLOR_MAP, useSnapContext } from '@/components/Snap/SnapContext.js';
import { type SnapAccentColor, type SnapCellGridProps } from '@/types/snap.js';

interface Props {
    name: string;
    props: SnapCellGridProps;
    accent: SnapAccentColor;
}

export function SnapCellGrid({
    name,
    props: { columns, rows, cells = [], selectable = false, selected },
    accent,
}: Props) {
    const { setCellGrid } = useSnapContext();
    const totalCells = columns * rows;

    function isSelected(idx: number): boolean {
        if (selected === undefined) return false;
        if (Array.isArray(selected)) return selected.includes(idx);
        return selected === idx;
    }

    function handlePress(idx: number) {
        if (!selectable) return;
        if (selectable === 'single') {
            setCellGrid(name, idx);
        } else {
            const current = Array.isArray(selected) ? selected : selected !== undefined ? [selected] : [];
            if (current.includes(idx)) {
                setCellGrid(
                    name,
                    current.filter((i) => i !== idx),
                );
            } else {
                setCellGrid(name, [...current, idx]);
            }
        }
    }

    return (
        <div
            className="w-full overflow-hidden rounded-lg"
            style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
            {Array.from({ length: totalCells }).map((_, idx) => {
                const cell = cells[idx];
                const selected = isSelected(idx);
                const bg = cell?.color ? ACCENT_COLOR_MAP[cell.color] : 'bg-bg';
                return (
                    <div
                        key={idx}
                        className={classNames('aspect-square', bg, {
                            'cursor-pointer hover:opacity-80': !!selectable,
                            'ring-2 ring-inset ring-white': selected,
                        })}
                        onClick={() => handlePress(idx)}
                        role={selectable ? 'button' : undefined}
                        tabIndex={selectable ? 0 : undefined}
                        aria-pressed={selectable ? selected : undefined}
                    />
                );
            })}
        </div>
    );
}
