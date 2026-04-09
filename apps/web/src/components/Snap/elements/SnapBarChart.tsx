import { classNames } from '@dimensiondev/utils';

import { ACCENT_COLOR_MAP } from '@/components/Snap/SnapContext.js';
import { type SnapAccentColor, type SnapBarChartProps } from '@/types/snap.js';

interface Props {
    props: SnapBarChartProps;
    accent: SnapAccentColor;
}

export function SnapBarChart({ props: { bars, max: maxOverride, color }, accent }: Props) {
    const max = maxOverride ?? Math.max(...bars.map((b) => b.value), 1);
    const defaultColor = ACCENT_COLOR_MAP[color ?? accent];

    return (
        <div className="w-full space-y-2">
            {bars.map((bar, idx) => {
                const pct = (bar.value / max) * 100;
                const barColor = bar.color ? ACCENT_COLOR_MAP[bar.color] : defaultColor;
                return (
                    <div key={idx} className="flex items-center gap-2">
                        <span className="text-secondary w-20 shrink-0 truncate text-right text-xs">{bar.label}</span>
                        <div className="bg-bg h-5 flex-1 overflow-hidden rounded-sm">
                            <div
                                className={classNames('h-full rounded-sm transition-all', barColor)}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <span className="text-secondary w-8 shrink-0 text-xs">{bar.value}</span>
                    </div>
                );
            })}
        </div>
    );
}
