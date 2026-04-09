import { classNames } from '@dimensiondev/utils';

import { type SnapSeparatorProps } from '@/types/snap.js';

interface Props {
    props: SnapSeparatorProps;
}

export function SnapSeparator({ props: { direction = 'horizontal' } }: Props) {
    return (
        <div
            className={classNames('border-line', {
                'my-1 w-full border-t': direction === 'horizontal',
                'mx-1 h-full self-stretch border-l': direction === 'vertical',
            })}
        />
    );
}
