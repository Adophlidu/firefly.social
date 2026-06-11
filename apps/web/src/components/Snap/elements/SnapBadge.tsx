import { classNames } from '@dimensiondev/utils';
import type { SnapAccentColor, SnapBadgeProps } from '@dimensiondev/workers-snap';

import { SnapIcon } from '@/components/Snap/elements/SnapIcon.js';
import { ACCENT_BORDER_MAP, ACCENT_COLOR_MAP, ACCENT_TEXT_MAP } from '@/components/Snap/SnapContext.js';

function resolveBadgeColor(color: SnapBadgeProps['color'], themeAccent: SnapAccentColor): SnapAccentColor {
    if (color === 'accent') return themeAccent;
    return color ?? 'purple';
}

interface Props {
    props: SnapBadgeProps;
    accent: SnapAccentColor;
}

export function SnapBadge({ props: { label, color, icon, variant = 'default' }, accent }: Props) {
    const palette = resolveBadgeColor(color, accent);
    return (
        <span
            className={classNames(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs',
                variant === 'outline'
                    ? classNames('border bg-transparent', ACCENT_BORDER_MAP[palette], ACCENT_TEXT_MAP[palette])
                    : classNames('text-white', ACCENT_COLOR_MAP[palette]),
            )}
        >
            {icon ? <SnapIcon props={{ name: icon, size: 'sm', color: 'inherit' }} /> : null}
            {label}
        </span>
    );
}
