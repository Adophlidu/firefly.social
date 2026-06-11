import { classNames } from '@dimensiondev/utils';
import type { SnapItemGroupProps } from '@dimensiondev/workers-snap';
import type { ReactNode } from 'react';

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
                'rounded-xl border border-line1': border,
                'divide-y divide-line': separator && !gap,
            })}
        >
            {children}
        </div>
    );
}
