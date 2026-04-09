import { classNames } from '@dimensiondev/utils';

import { ACCENT_COLOR_MAP } from '@/components/Snap/SnapContext.js';
import { type SnapAccentColor, type SnapBarChartProps } from '@/types/snap.js';

interface Props {
    props: SnapBarChartProps;
    accent: SnapAccentColor;
}

export function SnapBarChart({ props: { items }, accent }: Props) {
    const max = Math.max(...items.map((i) => i.value), 1);

    return (
        <div className="w-full space-y-2">
            {items.map((item, idx) => {
                const pct = (item.value / max) * 100;
                const barColor = ACCENT_COLOR_MAP[item.color ?? accent];
                return (
                    <div key={idx} className="flex items-center gap-2">
                        <span className="text-secondary w-20 shrink-0 truncate text-right text-xs">{item.label}</span>
                        <div className="bg-bg h-5 flex-1 overflow-hidden rounded-sm">
                            <div
                                className={classNames('h-full rounded-sm transition-all', barColor)}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <span className="text-secondary w-8 shrink-0 text-xs">{item.value}</span>
                    </div>
                );
            })}
        </div>
    );
}
