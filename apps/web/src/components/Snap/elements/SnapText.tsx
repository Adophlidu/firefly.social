import { classNames } from '@dimensiondev/utils';
import type { SnapTextProps } from '@dimensiondev/workers-snap';

interface Props {
    props: SnapTextProps;
}

export function SnapText({ props: { content, size = 'md', weight = 'normal', align } }: Props) {
    return (
        <p
            className={classNames('break-words text-main', {
                'text-sm': size === 'sm',
                'text-base': size === 'md',
                'font-bold': weight === 'bold',
                'font-normal': weight === 'normal',
                'text-left': align === 'left',
                'text-center': align === 'center',
                'text-right': align === 'right',
            })}
        >
            {content}
        </p>
    );
}
