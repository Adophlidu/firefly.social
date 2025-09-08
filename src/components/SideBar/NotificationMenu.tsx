import '@/assets/css/notification.css';

import { Trans } from '@lingui/react/macro';
import { memo, useCallback } from 'react';

import NotificationSelectedIcon from '@/assets/notification.selected.svg';
import NotificationIcon from '@/assets/notification.svg';
import NotificationDotIcon from '@/assets/notification-dot.svg';
import NotificationDotSelectedIcon from '@/assets/notification-dot-selected.svg';
import { BaseMenuItem } from '@/components/SideBar/BaseMenuItem.js';
import { NotificationSourceType, PageRoute, Source } from '@/constants/enum.js';
import { usePathname } from '@/esm/navigation.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { resolveNotificationUrl } from '@/helpers/resolveNotificationUrl.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
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
            icon={<Icon width={size} height={size} />}
            onClick={onLinkClick}
        />
    );
});
