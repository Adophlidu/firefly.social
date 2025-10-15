import { MenuItems, type MenuItemsProps } from '@headlessui/react';

import { classNames } from '@/helpers/classNames.js';
import { stopEvent } from '@/helpers/stopEvent.js';

interface MenuGroupProps extends MenuItemsProps {
    ref?: React.ForwardedRef<HTMLElement>;
}

export function MenuGroup({ className, children, ref, onClick = stopEvent, ...rest }: MenuGroupProps) {
    return (
        <MenuItems
            ref={ref}
            className={classNames(
                'z-menu flex w-max flex-col gap-2 overflow-hidden rounded-2xl border border-line bg-primaryBottom py-3 text-base text-main outline-none',
                typeof className === 'string' ? className : '',
            )}
            onClick={onClick}
            anchor="bottom end"
            {...rest}
        >
            {children}
        </MenuItems>
    );
}
