import { classNames } from '@dimensiondev/utils';
import { type ReactNode } from 'react';

import { type SnapItemGroupProps } from '@/types/snap.js';

interface Props {
    props: SnapItemGroupProps;
    children?: ReactNode;
}

export function SnapItemGroup({ props: { border = false, separator = true }, children }: Props) {
    return (
        <div
            className={classNames('w-full', {
                'border-line rounded-xl border': border,
                'divide-line divide-y': separator,
            })}
        >
            {children}
        </div>
    );
}
