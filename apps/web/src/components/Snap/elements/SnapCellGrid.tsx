'use client';

import { classNames } from '@dimensiondev/utils';
import type { CSSProperties } from 'react';

import { ACCENT_COLOR_MAP, ACCENT_RING_MAP, useSnapContext } from '@/components/Snap/SnapContext.js';
import type { SnapAccentColor, SnapCellGridProps } from '@/types/snap.js';

const SNAP_PALETTE_KEYS = new Set<SnapAccentColor>(['gray', 'blue', 'red', 'amber', 'green', 'teal', 'purple', 'pink']);

function resolveCellBackground(color: string | undefined): { className?: string; style?: CSSProperties } {
    if (!color) return { className: 'bg-bg' };
    if (color.startsWith('#')) return { style: { backgroundColor: color } };
    if (SNAP_PALETTE_KEYS.has(color as SnapAccentColor)) {
        return { className: ACCENT_COLOR_MAP[color as SnapAccentColor] };
    }
    return { className: 'bg-bg' };
}

interface Props {
    name: string;
    props: SnapCellGridProps;
    accent: SnapAccentColor;
}

const CELL_GRID_GAP_MAP: Record<NonNullable<SnapCellGridProps['gap']>, string> = {
    none: 'gap-0',
    sm: 'gap-0.5',
    md: 'gap-1',
    lg: 'gap-2',
};

export function SnapCellGrid({
    name: elementId,
    props: { cols, rows, cells = [], select = 'off', name: fieldName, gap = 'none', rowHeight },
    accent,
}: Props) {
    const { fields, setCellGrid } = useSnapContext();
    const fieldKey = fieldName ?? elementId;
    const totalCells = cols * rows;
    const isSelectable = select !== 'off';
    const selected = fields.cellGrids[fieldKey];

    function isSelected(idx: number): boolean {
        if (selected === undefined) return false;
        if (Array.isArray(selected)) return selected.includes(idx);
        return selected === idx;
    }

    function findCell(idx: number) {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        return cells.find((c) => c.row === row && c.col === col);
    }

    function handlePress(idx: number) {
        if (!isSelectable) return;
        if (select === 'single') {
            setCellGrid(fieldKey, idx);
        } else {
            const current = Array.isArray(selected) ? selected : selected !== undefined ? [selected as number] : [];
            if (current.includes(idx)) {
                setCellGrid(
                    fieldKey,
                    current.filter((i) => i !== idx),
                );
            } else {
                setCellGrid(fieldKey, [...current, idx]);
            }
        }
    }

    return (
        <div
            className={classNames('w-full overflow-hidden rounded-lg', CELL_GRID_GAP_MAP[gap])}
            style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
            {Array.from({ length: totalCells }).map((_, idx) => {
                const cell = findCell(idx);
                const sel = isSelected(idx);
                const cellBg = resolveCellBackground(cell?.color);
                return (
                    <div
                        key={idx}
                        className={classNames(
                            'flex items-center justify-center overflow-hidden text-xs font-medium',
                            rowHeight ? '' : 'aspect-square',
                            cellBg.className,
                            sel ? classNames('ring-2 ring-inset', ACCENT_RING_MAP[accent]) : null,
                            { 'cursor-pointer hover:opacity-80': isSelectable },
                        )}
                        style={{
                            ...(rowHeight !== undefined ? { height: rowHeight } : {}),
                            ...cellBg.style,
                        }}
                        onClick={() => handlePress(idx)}
                        role={isSelectable ? 'button' : undefined}
                        tabIndex={isSelectable ? 0 : undefined}
                        aria-pressed={isSelectable ? sel : undefined}
                    >
                        {cell?.content ? <span className="truncate px-0.5">{cell.content}</span> : null}
                    </div>
                );
            })}
        </div>
    );
}
