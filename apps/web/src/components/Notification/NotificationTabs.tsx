'use client';

import { SolidTabs } from '@/components/Tabs/SolidTabs.js';
import { queryClient } from '@/configs/queryClient.js';
import type { NotificationSource } from '@/constants/enum.js';
import { resolveNotificationUrl } from '@/helpers/resolveNotificationUrl.js';
import { resolveNotificationSourceName } from '@/helpers/resolveSourceName.js';
import { useNotificationSources } from '@/hooks/useNotificationSources.js';
import { captureNotificationTabClick } from '@/providers/telemetry/captureNotificationTabEvent.js';

interface NotificationTabsProps {
    source: NotificationSource;
}

export function NotificationTabs({ source }: NotificationTabsProps) {
    const sources = useNotificationSources();

    return (
        <SolidTabs
            data={sources}
            link={resolveNotificationUrl}
            itemRender={resolveNotificationSourceName}
            isSelected={(x) => x === source}
            onChange={(target) => {
                captureNotificationTabClick(target);
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
