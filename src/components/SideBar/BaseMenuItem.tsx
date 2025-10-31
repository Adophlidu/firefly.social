import { classNames } from '@firefly/utils';
import type { TippyProps } from '@tippyjs/react';
import { type HTMLProps, type ReactNode } from 'react';

import { Link } from '@/components/Link.js';
import { Tooltip } from '@/components/Tooltip.js';

interface BaseMenuItemProps extends HTMLProps<HTMLAnchorElement> {
    isSelected: boolean;
    collapsed: boolean;
    menuName: ReactNode;
    icon: ReactNode;
}

export function BaseMenuItem({ isSelected, collapsed, href, icon, menuName, ...rest }: BaseMenuItemProps) {
    return href ? (
        <Link
            {...rest}
            href={href}
            className={classNames('sidebar-nav-link flex w-full text-lg leading-6 outline-none md:pl-2', {
                'font-bold': isSelected,
            })}
        >
            <span className="flex items-center gap-x-3 rounded-lg p-2 md:px-4">
                {collapsed && icon ? (
                    <Tooltip content={menuName} placement="right">
                        {icon as TippyProps['children']}
                    </Tooltip>
                ) : (
                    icon
                )}
                <span style={{ display: collapsed ? 'none' : 'inline' }}>{menuName}</span>
            </span>
        </Link>
    ) : null;
}
