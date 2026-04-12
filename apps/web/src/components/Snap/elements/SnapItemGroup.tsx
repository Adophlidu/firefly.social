import { classNames } from '@dimensiondev/utils';
import type { ReactNode } from 'react';

import type { SnapItemGroupProps } from '@/types/snap.js';

const GAP_MAP: Record<NonNullable<SnapItemGroupProps['gap']>, string> = {
    none: 'gap-0',
    sm: 'gap-1',
    md: 'gap-3',
    lg: 'gap-5',
};

interface Props {
    props: SnapItemGroupProps;
    children?: ReactNode;
}

export function SnapItemGroup({ props: { border = false, separator = true, gap }, children }: Props) {
    return (
        <div
            className={classNames('w-full', gap ? GAP_MAP[gap] : '', {
                'border-line1 rounded-xl border': border,
                'divide-line divide-y': separator && !gap,
            })}
        >
            {children}
        </div>
    );
}
