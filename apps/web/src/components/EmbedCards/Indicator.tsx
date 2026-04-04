import { classNames } from '@dimensiondev/utils';
import { type HTMLProps, memo } from 'react';

export interface IndicatorProps extends HTMLProps<HTMLDivElement> {
    active?: boolean;
}

export const Indicator = memo<IndicatorProps>(function Indicator({ className, active, ...rest }) {
    return (
        <div {...rest} className={classNames('w-[60px] min-w-2 cursor-pointer py-2', className)}>
            <div className={classNames('bg-highlight h-1', active ? '' : 'opacity-50')} />
        </div>
    );
});
