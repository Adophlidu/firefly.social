import { classNames } from '@dimensiondev/utils';
import type { SnapAccentColor, SnapBarChartProps } from '@dimensiondev/workers-snap';

import { ACCENT_COLOR_MAP, resolveSnapPaletteKey } from '@/components/Snap/SnapContext.js';

interface Props {
    props: SnapBarChartProps;
    accent: SnapAccentColor;
}

export function SnapBarChart({ props: { bars, max: maxOverride, color }, accent }: Props) {
    const max = maxOverride ?? Math.max(...bars.map((b) => b.value), 1);
    const defaultColor = ACCENT_COLOR_MAP[resolveSnapPaletteKey(color, accent)];

    return (
        <div className="w-full space-y-2">
            {bars.map((bar, idx) => {
                const pct = (bar.value / max) * 100;
                const barColor = bar.color ? ACCENT_COLOR_MAP[bar.color] : defaultColor;
                return (
                    <div key={idx} className="flex items-center gap-2">
                        <span className="w-20 shrink-0 truncate text-right text-xs text-secondary">{bar.label}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-md bg-bg">
                            <div
                                className={classNames('h-full rounded-md transition-all', barColor)}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <span className="w-8 shrink-0 text-xs text-secondary">{bar.value}</span>
                    </div>
                );
            })}
        </div>
    );
}
