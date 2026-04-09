import { classNames } from '@dimensiondev/utils';

import { ACCENT_COLOR_MAP } from '@/components/Snap/SnapContext.js';
import { type SnapBadgeProps } from '@/types/snap.js';

interface Props {
    props: SnapBadgeProps;
}

export function SnapBadge({ props: { label, color = 'purple' } }: Props) {
    return (
        <span
            className={classNames(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white',
                ACCENT_COLOR_MAP[color],
            )}
        >
            {label}
        </span>
    );
}
