'use client';

import MessagesIcon from '@dimensiondev/assets/messages.svg';
import { PageRoute } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { plural } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { BaseMenuItem } from '@/components/SideBar/BaseMenuItem.js';
import { formatDmUnreadCount } from '@/components/SideBar/formatDmUnreadCount.js';
import { useAuthenticatedDmAccount, useDmCounters } from '@/hooks/useDmSession.js';

interface MessagesMenuProps {
    isSelected: boolean;
    collapsed: boolean;
    size?: number;
}

interface UnreadBadgeProps {
    count: number;
    collapsed: boolean;
}

const UnreadBadge = memo(function UnreadBadge({ count, collapsed }: UnreadBadgeProps) {
    if (!count) return null;

    return (
        <span
            aria-label={plural(count, { one: '# unread message', other: '# unread messages' })}
            className={classNames(
                'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-fireflyBrand px-1 text-[11px] font-bold leading-none text-white',
                {
                    'absolute -right-2 -top-2 ring-2 ring-primaryBottom': collapsed,
                    'ml-2 align-middle': !collapsed,
                },
            )}
        >
            {formatDmUnreadCount(count)}
        </span>
    );
});

export const MessagesMenu = memo<MessagesMenuProps>(function MessagesMenu({ isSelected, collapsed, size = 20 }) {
    const { authenticatedAccount } = useAuthenticatedDmAccount();
    const counters = useDmCounters(authenticatedAccount);
    const unreadCount = Math.max(0, counters.data?.total_unread_dms_count ?? 0);

    return (
        <BaseMenuItem
            href={PageRoute.Messages}
            isSelected={isSelected}
            collapsed={collapsed}
            menuName={
                <>
                    <Trans>Messages</Trans>
                    {!collapsed ? <UnreadBadge count={unreadCount} collapsed={false} /> : null}
                </>
            }
            icon={
                <span className="relative flex size-5 items-center justify-center">
                    <MessagesIcon width={size} height={size} />
                    {collapsed ? <UnreadBadge count={unreadCount} collapsed /> : null}
                </span>
            }
        />
    );
});
