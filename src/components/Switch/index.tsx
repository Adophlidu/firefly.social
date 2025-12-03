import { classNames } from '@dimensiondev/utils';
import { Switch as HeadlessSwitch, type SwitchProps } from '@headlessui/react';
import { memo } from 'react';

import { LoadingIcon } from '@/components/LoadingIcon.js';

interface Props extends Omit<SwitchProps, 'className'> {
    loading?: boolean;
    className?: string;
    size?: 'small' | 'medium';
}

export const Switch = memo<Props>(function Switch({ className, loading, size = 'medium', ...rest }) {
    return (
        <HeadlessSwitch
            {...rest}
            className={classNames(
                'group inline-flex shrink-0 items-center rounded-full bg-second transition data-[checked]:bg-highlight dark:bg-bg data-[checked]:dark:bg-highlight',
                className,
                {
                    'h-[18px] w-[32px]': size === 'small',
                    'h-[22px] w-11': size === 'medium',
                },
            )}
        >
            <span
                className={classNames('flex items-center justify-center rounded-full bg-white transition', {
                    'size-[14px] translate-x-[2px] group-data-[checked]:translate-x-[16px]': size === 'small',
                    'size-4 translate-x-1 group-data-[checked]:translate-x-6': size === 'medium',
                })}
            >
                {loading ? <LoadingIcon className="text-darkBottom" size={12} /> : null}
            </span>
        </HeadlessSwitch>
    );
});
