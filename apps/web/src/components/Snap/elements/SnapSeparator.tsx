import { classNames } from '@dimensiondev/utils';

import type { SnapSeparatorProps } from '@/types/snap.js';

interface Props {
    props: SnapSeparatorProps;
}

export function SnapSeparator({ props: { orientation = 'horizontal' } }: Props) {
    return (
        <div
            className={classNames('border-line1', {
                'my-1 w-full border-t': orientation === 'horizontal',
                'mx-1 h-full self-stretch border-l': orientation === 'vertical',
            })}
        />
    );
}
