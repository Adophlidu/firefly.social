import { classNames } from '@dimensiondev/utils';

import { ACCENT_COLOR_MAP, resolveSnapPaletteKey } from '@/components/Snap/SnapContext.js';
import { type SnapAccentColor, type SnapProgressProps } from '@/types/snap.js';

interface Props {
    props: SnapProgressProps;
    accent: SnapAccentColor;
}

export function SnapProgress({ props: { value, max = 100, label, color }, accent }: Props) {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    const barColor = ACCENT_COLOR_MAP[resolveSnapPaletteKey(color, accent)];

    return (
        <div className="w-full">
            {label ? <span className="text-secondary mb-1 block text-xs">{label}</span> : null}
            <div className="bg-bg h-2 w-full overflow-hidden rounded-full">
                <div
                    className={classNames('h-full rounded-full transition-all', barColor)}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
