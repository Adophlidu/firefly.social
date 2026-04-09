import { classNames } from '@dimensiondev/utils';

import { type SnapTextProps } from '@/types/snap.js';

interface Props {
    props: SnapTextProps;
}

export function SnapText({ props: { content, size = 'md', weight = 'normal' } }: Props) {
    return (
        <p
            className={classNames('text-main break-words', {
                'text-sm': size === 'sm',
                'text-base': size === 'md',
                'font-bold': weight === 'bold',
                'font-normal': weight === 'normal',
            })}
        >
            {content}
        </p>
    );
}
