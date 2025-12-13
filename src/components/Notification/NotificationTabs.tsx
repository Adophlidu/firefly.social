'use client';

import { SolidTabs } from '@/components/Tabs/SolidTabs.js';
import { queryClient } from '@/configs/queryClient.js';
import { SORTED_NOTIFICATIONS_SOURCES } from '@/constants/computed.js';
import type { NotificationSource } from '@/constants/enum.js';
import { resolveNotificationUrl } from '@/helpers/resolveNotificationUrl.js';
import { resolveNotificationSourceName } from '@/helpers/resolveSourceName.js';

interface NotificationTabsProps {
    source: NotificationSource;
}

export function NotificationTabs({ source }: NotificationTabsProps) {
    return (
        <SolidTabs
            data={SORTED_NOTIFICATIONS_SOURCES}
            link={resolveNotificationUrl}
            itemRender={resolveNotificationSourceName}
            isSelected={(x) => x === source}
            onChange={(target) => {
                if (target !== source) return;

                queryClient.refetchQueries({
                    queryKey: ['notifications', target],
                });
                queryClient.invalidateQueries({
                    queryKey: ['notification', target],
                });
            }}
        />
    );
}
