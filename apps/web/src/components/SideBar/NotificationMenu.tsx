'use client';

import { Source } from '@dimensiondev/enums';
import '@/styles/notification.css';

import NotificationSelectedIcon from '@dimensiondev/assets/notification.selected.svg';
import NotificationIcon from '@dimensiondev/assets/notification.svg';
import NotificationDotIcon from '@dimensiondev/assets/notification-dot.svg';
import NotificationDotSelectedIcon from '@dimensiondev/assets/notification-dot-selected.svg';
import { safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo, useCallback } from 'react';

import { BaseMenuItem } from '@/components/SideBar/BaseMenuItem.js';
import { NotificationSourceType, PageRoute } from '@/constants/enum.js';
import { usePathname } from '@/esm/navigation.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { resolveNotificationUrl } from '@/helpers/resolveNotificationUrl.js';
import { useNewestNotification } from '@/hooks/useNewestNotification.js';
import { captureNotificationMenuClick } from '@/providers/telemetry/captureNotificationEvent.js';

interface NotificationMenuProps {
    isSelected: boolean;
    collapsed: boolean;
    size?: number;
}

function resolveNotificationSource(source: NotificationSourceType) {
    switch (source) {
        case NotificationSourceType.Tips:
        case NotificationSourceType.Schedule:
            return Source.Notifications;
        case NotificationSourceType.Farcaster:
            return Source.Farcaster;
        case NotificationSourceType.Bsky:
            return Source.Bsky;
        case NotificationSourceType.Lens:
            return Source.Lens;
        case NotificationSourceType.X:
            return Source.Twitter;
        default:
            safeUnreachable(source);
            return Source.Notifications;
    }
}

export const NotificationMenu = memo<NotificationMenuProps>(function NotificationMenuIcon({
    isSelected,
    collapsed,
    size = 20,
}) {
    const pathname = usePathname();

    const recordWithNew = useNewestNotification();
    const hasNewNotification = !!recordWithNew && !isRoutePathname(pathname, PageRoute.Notifications);

    const onLinkClick = useCallback(() => {
        if (hasNewNotification) {
            captureNotificationMenuClick();
        }
    }, [hasNewNotification]);

    const Icon = isSelected
        ? hasNewNotification
            ? NotificationDotSelectedIcon
            : NotificationSelectedIcon
        : hasNewNotification
          ? NotificationDotIcon
          : NotificationIcon;

    return (
        <BaseMenuItem
            href={resolveNotificationUrl(
                recordWithNew?.type ? resolveNotificationSource(recordWithNew.type) : Source.Notifications,
            )}
            isSelected={isSelected}
            collapsed={collapsed}
            menuName={<Trans>Notifications</Trans>}
            icon={<Icon className={hasNewNotification ? 'swing-animation' : ''} width={size} height={size} />}
            onClick={onLinkClick}
        />
    );
});
