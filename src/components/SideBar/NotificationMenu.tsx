import '@/assets/css/notification.css';

import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';
import { memo, useCallback, useMemo } from 'react';

import NotificationSelectedIcon from '@/assets/notification.selected.svg';
import NotificationIcon from '@/assets/notification.svg';
import NotificationDotIcon from '@/assets/notification-dot.svg';
import NotificationDotSelectedIcon from '@/assets/notification-dot-selected.svg';
import { BaseMenuItem } from '@/components/SideBar/BaseMenuItem.js';
import { NotificationSourceType, PageRoute, Source } from '@/constants/enum.js';
import { SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { usePathname } from '@/esm/navigation.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { resolveNotificationUrl } from '@/helpers/resolveNotificationUrl.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { captureNotificationMenuClick } from '@/providers/telemetry/captureNotificationEvent.js';
import { getIsActivated } from '@/services/listenNotifications.js';
import { usePreferencesState } from '@/store/usePreferenceStore.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

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
    const currentProfiles = useCurrentProfilesAll();
    const { preferences } = usePreferencesState();
    const { currentProfileSession } = useFireflyProfileStore();
    const pathname = usePathname();

    const recordWithNew = useMemo(() => {
        if (isRoutePathname(pathname, PageRoute.Notifications)) return null;

        const allRecords = Object.entries(preferences.NOTIFICATION_READ_RECORD || {}).flatMap(([type, records]) => {
            return records.map((x) => ({ ...x, type: type as NotificationSourceType }));
        });
        if (!currentProfileSession?.profileId || !allRecords.length || !getIsActivated()) return null;

        const allProfileIds = compact([
            currentProfileSession.profileId,
            ...SORTED_SOCIAL_SOURCES.map((x) => currentProfiles[x]?.profileId),
        ]);
        return allRecords.find((record) =>
            allProfileIds.some((profileId) => record.profileId === profileId && record.hasNewNotification),
        );
    }, [currentProfileSession?.profileId, preferences, currentProfiles, pathname]);
    const hasNewNotification = !!recordWithNew;

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
