import '@/assets/css/notification.css';

import { compact } from 'lodash-es';
import { memo, type ReactNode, useCallback, useMemo } from 'react';

import NotificationSelectedIcon from '@/assets/notification.selected.svg';
import NotificationIcon from '@/assets/notification.svg';
import NotificationDotIcon from '@/assets/notification-dot.svg';
import NotificationDotSelectedIcon from '@/assets/notification-dot-selected.svg';
import { Link } from '@/components/Link.js';
import { Tooltip } from '@/components/Tooltip.js';
import { SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { captureNotificationMenuClick } from '@/providers/telemetry/captureNotificationEvent.js';
import { getIsActivated } from '@/services/listenNotifications.js';
import { usePreferencesState } from '@/store/usePreferenceStore.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

interface NotificationMenuProps {
    path: string;
    isSelected: boolean;
    collapsed: boolean;
    menuName: ReactNode;
    size?: number;
}

export const NotificationMenu = memo<NotificationMenuProps>(function NotificationMenuIcon({
    path,
    isSelected,
    collapsed,
    menuName,
    size = 20,
}) {
    const currentProfiles = useCurrentProfilesAll();
    const { preferences } = usePreferencesState();
    const { currentProfileSession } = useFireflyProfileStore();
    const hasNewNotification = useMemo(() => {
        const allRecords = Object.values(preferences.NOTIFICATION_READ_RECORD || []).flat();
        if (!currentProfileSession?.profileId || !allRecords.length || !getIsActivated()) return false;

        return compact([
            currentProfileSession.profileId,
            ...SORTED_SOCIAL_SOURCES.map((x) => currentProfiles[x]?.profileId),
        ]).some((profileId) => {
            return allRecords.some((record) => record.profileId === profileId && record.hasNewNotification);
        });
    }, [currentProfileSession?.profileId, preferences, currentProfiles]);

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
        <Link
            href={path}
            className={classNames('sidebar-nav-link flex w-full text-lg leading-6 outline-none md:px-2', {
                'font-bold': isSelected,
            })}
            onClick={onLinkClick}
        >
            <span className="flex items-center gap-x-3 rounded-lg px-2 py-2 md:px-4">
                {collapsed ? (
                    <Tooltip content={menuName} placement="right">
                        <Icon width={size} height={size} />
                    </Tooltip>
                ) : (
                    <Icon className={hasNewNotification ? 'swing-animation' : ''} width={size} height={size} />
                )}
                <span style={{ display: collapsed ? 'none' : 'inline' }}>{menuName}</span>
            </span>
        </Link>
    );
});
